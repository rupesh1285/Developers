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
 * Executes C++ code. Optimized for production (Render/Linux) and local development.
 */
const runCppCode = (code, input = "") => {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const jobId = crypto.randomUUID();
        const jobDir = path.join(tempDir, jobId);
        const codeFilePath = path.join(jobDir, 'main.cpp');
        
        // Use .exe for Windows local, no extension for Linux/Render
        const isWin = process.platform === 'win32';
        const exeFileName = isWin ? 'main.exe' : 'main';
        const exeFilePath = path.join(jobDir, exeFileName);

        try {
            if (!fs.existsSync(jobDir)) fs.mkdirSync(jobDir, { recursive: true });
            fs.writeFileSync(codeFilePath, code);

            // Command to compile
            const compileCmd = 'g++';
            const compileArgs = ['main.cpp', '-o', exeFileName];

            console.log(`[CodeRunner] Compiling for job ${jobId} on ${process.platform}...`);

            execFile(compileCmd, compileArgs, { cwd: jobDir, timeout: 15000 }, (compileErr, cStdout, cStderr) => {
                if (compileErr) {
                    cleanup(jobDir);
                    return resolve({ 
                        success: false, 
                        output: cStdout, 
                        error: "Compilation Error:\n" + (cStderr || compileErr.message), 
                        executionTime: Date.now() - startTime 
                    });
                }

                // Command to run the executable
                // On Linux/Render, we need ./main
                const runCmd = isWin ? exeFilePath : `./${exeFileName}`;
                
                execFile(runCmd, [], { cwd: jobDir, timeout: 10000 }, (runErr, rStdout, rStderr) => {
                    const totalTime = Date.now() - startTime;
                    cleanup(jobDir);

                    if (runErr) {
                        return resolve({ 
                            success: false, 
                            output: rStdout, 
                            error: "Runtime Error:\n" + (rStderr || runErr.message), 
                            executionTime: totalTime 
                        });
                    }

                    resolve({ 
                        success: true, 
                        output: rStdout, 
                        error: null, 
                        executionTime: totalTime 
                    });
                });
            });

        } catch (err) {
            cleanup(jobDir);
            resolve({ success: false, output: "", error: "Runner System Error: " + err.message, executionTime: Date.now() - startTime });
        }
    });
};

const cleanup = (dir) => {
    try { if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
};

module.exports = {
    runCppCode
};
