const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// The base directory where we will store temporary files
const tempDir = path.join(__dirname, '..', 'temp');

// Ensure the temp directory exists
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

/**
 * Executes C++ code in a Docker container
 * @param {string} code - The C++ source code
 * @param {string} input - Optional stdin input for the code
 * @returns {Promise<{success: boolean, output: string, error: string, executionTime: number}>}
 */
const runCppCode = (code, input = "") => {
    return new Promise((resolve) => {
        const startTime = Date.now();
        // Generate a unique ID for this execution
        const jobId = crypto.randomUUID();
        const jobDir = path.join(tempDir, jobId);
        const codeFilePath = path.join(jobDir, 'main.cpp');

        try {
            // 1. Create a unique folder for this job
            fs.mkdirSync(jobDir, { recursive: true });

            // 2. Write the C++ code to the file
            fs.writeFileSync(codeFilePath, code);

            // 3. Construct the Docker command arguments for execFile
            // -v mounts the job directory into the container at /home/runner/app
            // -w sets the working directory
            // --network none prevents the code from accessing the internet
            // --memory="256m" limits memory usage
            // my-cpp-runner is the custom image we will build from our Dockerfile
            const dockerArgs = [
                'run', 
                '--rm', 
                '-v', `${jobDir}:/home/runner/app`, 
                '-w', '/home/runner/app', 
                '--network', 'none', 
                '--memory=256m', 
                'my-cpp-runner', 
                'sh', '-c', 'g++ main.cpp -o main && ./main'
            ];

            console.log(`[CodeRunner] Starting docker for job ${jobId}`);
            console.log(`[CodeRunner] JobDir: ${jobDir}`);
            console.log(`[CodeRunner] Code:\n${code}\n-----------------`);

            // 4. Execute the command using execFile (safer than exec)
            execFile('docker', dockerArgs, { timeout: 20000 }, (error, stdout, stderr) => {
                const executionTime = Date.now() - startTime;
                
                // Cleanup: Delete the temporary job directory
                try {
                    fs.rmSync(jobDir, { recursive: true, force: true });
                } catch (cleanupErr) {
                    console.error("Failed to cleanup job directory:", cleanupErr);
                }

                if (error) {
                    // Check if the error was due to a timeout
                    if (error.killed) {
                        return resolve({
                            success: false,
                            output: "",
                            error: "Execution Timeout: Code took too long to run.",
                            executionTime
                        });
                    }
                    
                    // Compilation or Runtime Error
                    return resolve({
                        success: false,
                        output: stdout,
                        error: stderr || error.message,
                        executionTime
                    });
                }

                // Success
                resolve({
                    success: true,
                    output: stdout,
                    error: null,
                    executionTime
                });
            });

        } catch (err) {
            // Cleanup on setup failure
            if (fs.existsSync(jobDir)) {
                fs.rmSync(jobDir, { recursive: true, force: true });
            }
            resolve({
                success: false,
                output: "",
                error: "Server Error during setup: " + err.message,
                executionTime: Date.now() - startTime
            });
        }
    });
};

module.exports = {
    runCppCode
};
