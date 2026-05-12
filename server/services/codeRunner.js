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
 * 🌍 OMNI-RUNNER: Executes code for C, C++, Python, Java, and JavaScript.
 */
const runCode = (language, code, input = "") => {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const jobId = crypto.randomUUID();
        const jobDir = path.join(tempDir, jobId);
        
        // Map CoderMirror language modes to filenames and commands
        const config = {
            "text/x-c++src": { ext: "cpp", compiler: "clang++", runner: "./main", args: ["-O0", "-fno-stack-protector"] },
            "text/x-csrc": { ext: "c", compiler: "clang", runner: "./main", args: ["-O0"] },
            "python": { ext: "py", runner: "python3", args: [] },
            "javascript": { ext: "js", runner: "node", args: [] },
            "text/x-java": { ext: "java", compiler: "javac", runner: "java", className: "Solution", args: [] }
        };

        const lang = config[language] || config["javascript"];
        
        // ☕ JAVA SPECIAL HANDLING: Extract class name from code
        let javaClassName = "Solution";
        if (language === "text/x-java") {
            const match = code.match(/public\s+class\s+(\w+)/);
            if (match) javaClassName = match[1];
        }

        const fileName = language === "text/x-java" ? `${javaClassName}.java` : (lang.className ? `${lang.className}.${lang.ext}` : `main.${lang.ext}`);
        const className = language === "text/x-java" ? javaClassName : lang.className;
        const codeFilePath = path.join(jobDir, fileName);

        try {
            if (!fs.existsSync(jobDir)) fs.mkdirSync(jobDir, { recursive: true });
            fs.writeFileSync(codeFilePath, code);

            const isProduction = process.env.NODE_ENV === 'production';

            if (isProduction) {
                // 🚀 PRODUCTION MODE: Optimized for Render (Direct in container)
                const codeHash = crypto.createHash('sha256').update(code).digest('hex');
                const binPath = path.join(tempDir, `bin_${codeHash}`);

                // ⚡ CACHE CHECK (Compiled languages only - Skip Java due to multi-file nature)
                if (lang.compiler && language !== "text/x-java" && fs.existsSync(binPath)) {
                    console.log(`[CodeRunner] Cache Hit: ${codeHash}`);
                    const runArgs = language === "text/x-java" ? ["-cp", tempDir, className] : [];
                    const runCmd = language === "text/x-java" ? "java" : binPath;
                    
                    return execFile(runCmd, runArgs, { timeout: 10000 }, (rErr, rOut, rErrOut) => {
                        const totalTime = Date.now() - startTime;
                        cleanup(jobDir);
                        if (rErr) return resolve({ success: false, output: rOut, error: "Runtime Error:\n" + (rErrOut || rErr.message), executionTime: totalTime });
                        resolve({ success: true, output: rOut, error: null, executionTime: totalTime });
                    });
                }

                // EXECUTION LOGIC
                if (lang.compiler) {
                    // COMPILED LANGUAGES (C, C++, Java)
                    let compileArgs = [fileName, "-o", binPath, ...lang.args];
                    if (language === "text/x-c++src") {
                        // Use the stable Pre-compiled Header path
                        compileArgs.unshift("-include-pch", "/usr/include/stdc++.h.pch");
                    }
                    if (language === "text/x-java") {
                        compileArgs = [fileName]; // javac only needs the filename
                    }

                    execFile(lang.compiler, compileArgs, { cwd: jobDir, timeout: 15000 }, (cErr, cOut, cErrOut) => {
                        if (cErr) {
                            cleanup(jobDir);
                            return resolve({ success: false, output: cOut, error: "Compilation Error:\n" + (cErrOut || cErr.message), executionTime: Date.now() - startTime });
                        }
                        
                        const runCmd = language === "text/x-java" ? "java" : binPath;
                        const runArgs = language === "text/x-java" ? [className] : [];

                        execFile(runCmd, runArgs, { cwd: jobDir, timeout: 10000 }, (rErr, rOut, rErrOut) => {
                            const totalTime = Date.now() - startTime;
                            cleanup(jobDir);
                            if (rErr) return resolve({ success: false, output: rOut, error: "Runtime Error:\n" + (rErrOut || rErr.message), executionTime: totalTime });
                            resolve({ success: true, output: rOut, error: null, executionTime: totalTime });
                        });
                    });
                } else {
                    // INTERPRETED LANGUAGES (Python, JS)
                    execFile(lang.runner, [fileName], { cwd: jobDir, timeout: 10000 }, (rErr, rOut, rErrOut) => {
                        const totalTime = Date.now() - startTime;
                        cleanup(jobDir);
                        if (rErr) return resolve({ success: false, output: rOut, error: "Runtime Error:\n" + (rErrOut || rErr.message), executionTime: totalTime });
                        resolve({ success: true, output: rOut, error: null, executionTime: totalTime });
                    });
                }
            } else {
                // 🏠 LOCAL MODE: Smart Fallback (Host -> Docker)
                const runLocal = (cmd, args, fallback) => {
                    execFile(cmd, args, { cwd: jobDir, timeout: 10000 }, (err, stdout, stderr) => {
                        if (err && err.code === 'ENOENT') {
                            console.log(`[CodeRunner] ${cmd} not found on host, falling back to Docker...`);
                            return fallback();
                        }
                        const totalTime = Date.now() - startTime;
                        cleanup(jobDir);
                        if (err) return resolve({ success: false, output: stdout, error: "Runtime Error:\n" + (stderr || err.message), executionTime: totalTime });
                        resolve({ success: true, output: stdout, error: null, executionTime: totalTime });
                    });
                };

                if (lang.compiler) {
                    // Try host compiler (g++ or javac)
                    const hostCompiler = language === "text/x-java" ? "javac" : "g++";
                    const outBin = process.platform === 'win32' ? 'main.exe' : './main';
                    
                    execFile(hostCompiler, [fileName, "-o", "main", "-O0"], { cwd: jobDir, timeout: 10000 }, (cErr) => {
                        if (cErr && cErr.code === 'ENOENT') {
                            // FALLBACK TO DOCKER
                            console.log(`[CodeRunner] ${hostCompiler} not found. Falling back to Docker...`);
                            const dockerImages = { "text/x-c++src": "gcc:latest", "text/x-csrc": "gcc:latest", "text/x-java": "openjdk:latest" };
                            const dockerCmd = language === "text/x-java" 
                                ? `javac ${fileName} && java ${className}`
                                : `g++ ${fileName} -o main -O0 && ./main`;

                            const dockerArgs = [
                                'run', '--rm', '-v', `${jobDir}:/app`, '-w', '/app',
                                dockerImages[language] || "gcc:latest", 'sh', '-c', dockerCmd
                            ];

                            return execFile('docker', dockerArgs, { timeout: 60000 }, (dErr, dOut, dErrOut) => {
                                const totalTime = Date.now() - startTime;
                                cleanup(jobDir);
                                if (dErr) return resolve({ success: false, output: dOut, error: "Docker Error: " + (dErrOut || dErr.message), executionTime: totalTime });
                                resolve({ success: true, output: dOut, error: null, executionTime: totalTime });
                            });
                        }

                        if (cErr) {
                            cleanup(jobDir);
                            return resolve({ success: false, output: "", error: "Compilation Error: " + cErr.message, executionTime: Date.now() - startTime });
                        }

                        const runCmd = language === "text/x-java" ? "java" : outBin;
                        const runArgs = language === "text/x-java" ? [className] : [];

                        execFile(runCmd, runArgs, { cwd: jobDir, timeout: 5000 }, (rErr, rOut, rErrOut) => {
                            const totalTime = Date.now() - startTime;
                            cleanup(jobDir);
                            if (rErr) return resolve({ success: false, output: rOut, error: "Runtime Error:\n" + (rErrOut || rErr.message), executionTime: totalTime });
                            resolve({ success: true, output: rOut, error: null, executionTime: totalTime });
                        });
                    });
                } else {
                    // Interpreted (Try python3 then python, then Docker)
                    const hostCmd = language === "python" ? (process.platform === 'win32' ? "python" : "python3") : lang.runner;
                    
                    execFile(hostCmd, [fileName], { cwd: jobDir, timeout: 5000 }, (err, stdout, stderr) => {
                        if (err && err.code === 'ENOENT') {
                            const dockerImg = language === "python" ? "python:3-slim" : "node:slim";
                            const dockerArgs = ['run', '--rm', '-v', `${jobDir}:/app`, '-w', '/app', dockerImg, lang.runner, fileName];
                            return execFile('docker', dockerArgs, { timeout: 30000 }, (dErr, dOut, dErrOut) => {
                                const totalTime = Date.now() - startTime;
                                cleanup(jobDir);
                                if (dErr) return resolve({ success: false, output: dOut, error: dErrOut || dErr.message, executionTime: totalTime });
                                resolve({ success: true, output: dOut, error: null, executionTime: totalTime });
                            });
                        }
                        const totalTime = Date.now() - startTime;
                        cleanup(jobDir);
                        if (err) return resolve({ success: false, output: stdout, error: stderr || err.message, executionTime: totalTime });
                        resolve({ success: true, output: stdout, error: null, executionTime: totalTime });
                    });
                }
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
    runCode
};
