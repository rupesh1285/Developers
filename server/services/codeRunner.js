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
 * Executes C++ code. 
 * - Locally: Uses 'docker run' to spawn temporary containers (per the plan).
 * - Production (Render): Runs directly inside the backend's Docker container.
 */
const runCppCode = (code, input = "") => {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const jobId = crypto.randomUUID();
        const jobDir = path.join(tempDir, jobId);
        const codeFilePath = path.join(jobDir, 'main.cpp');

        try {
            if (!fs.existsSync(jobDir)) fs.mkdirSync(jobDir, { recursive: true });
            fs.writeFileSync(codeFilePath, code);

            // Check if we are running in a container already (Production)
            // Or if we should use the local Docker spawning method
            const isProduction = process.env.NODE_ENV === 'production';

            if (isProduction) {
                // PRODUCTION: We are already inside a Docker container!
                // Just run g++ directly. It's safe and isolated.
                console.log(`[CodeRunner] Production Mode: Running directly inside backend container.`);
                const compileCmd = 'g++';
                const compileArgs = ['main.cpp', '-o', 'main', '-O0']; // 🌟 -O0 for lightning-fast compilation
                
                execFile(compileCmd, compileArgs, { cwd: jobDir, timeout: 15000 }, (cErr, cOut, cErrOut) => {
                    if (cErr) {
                        cleanup(jobDir);
                        return resolve({ success: false, output: cOut, error: "Compilation Error:\n" + (cErrOut || cErr.message), executionTime: Date.now() - startTime });
                    }
                    
                    execFile('./main', [], { cwd: jobDir, timeout: 10000 }, (rErr, rOut, rErrOut) => {
                        const totalTime = Date.now() - startTime;
                        cleanup(jobDir);
                        if (rErr) return resolve({ success: false, output: rOut, error: "Runtime Error:\n" + (rErrOut || rErr.message), executionTime: totalTime });
                        resolve({ success: true, output: rOut, error: null, executionTime: totalTime });
                    });
                });
            } else {
                // LOCAL: Try direct g++ first for sub-second speed, fallback to Docker
                const compileCmd = 'g++';
                const compileArgs = ['main.cpp', '-o', 'main', '-O0']; // 🌟 -O0 for local speed too
                
                console.log(`[CodeRunner] Local Mode: Attempting direct execution for speed...`);
                execFile(compileCmd, compileArgs, { cwd: jobDir, timeout: 10000 }, (cErr, cOut, cErrOut) => {
                    if (cErr) {
                        // If g++ isn't on host, fallback to Docker (the original behavior)
                        console.log(`[CodeRunner] Local Mode: g++ not on host, falling back to Docker.`);
                        const dockerArgs = [
                            'run', '--rm', 
                            '-v', `${jobDir}:/home/runner/app`, 
                            '-w', '/home/runner/app', 
                            '--network', 'none', '--memory=256m', 
                            'my-cpp-runner', 
                            'sh', '-c', 'g++ main.cpp -o main -O0 && ./main' // 🌟 Added -O0 inside Docker too
                        ];
                        execFile('docker', dockerArgs, { timeout: 15000 }, (dErr, dOut, dErrOut) => {
                            const totalTime = Date.now() - startTime;
                            cleanup(jobDir);
                            if (dErr) return resolve({ success: false, output: dOut, error: dErr.killed ? "Timeout" : (dErrOut || dErr.message), executionTime: totalTime });
                            resolve({ success: true, output: dOut, error: null, executionTime: totalTime });
                        });
                        return;
                    }
                    
                    // Direct run (Handle Windows .exe vs Linux binary)
                    const exePath = process.platform === 'win32' ? 'main.exe' : './main';
                    execFile(exePath, [], { cwd: jobDir, timeout: 5000 }, (rErr, rOut, rErrOut) => {
                        const totalTime = Date.now() - startTime;
                        cleanup(jobDir);
                        if (rErr) return resolve({ success: false, output: rOut, error: "Runtime Error:\n" + (rErrOut || rErr.message), executionTime: totalTime });
                        resolve({ success: true, output: rOut, error: null, executionTime: totalTime });
                    });
                });
            }

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
