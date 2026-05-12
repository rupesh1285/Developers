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
            "text/x-java": { ext: "java", compiler: "javac", runner: "java", className: "Solution" }
        };

        const lang = config[language] || config["javascript"];
        const fileName = lang.className ? `${lang.className}.${lang.ext}` : `main.${lang.ext}`;
        const codeFilePath = path.join(jobDir, fileName);

        try {
            if (!fs.existsSync(jobDir)) fs.mkdirSync(jobDir, { recursive: true });
            fs.writeFileSync(codeFilePath, code);

            const isProduction = process.env.NODE_ENV === 'production';

            if (isProduction) {
                // 🚀 PRODUCTION MODE: Optimized for Render (Direct in container)
                const codeHash = crypto.createHash('sha256').update(code).digest('hex');
                const binPath = path.join(tempDir, `bin_${codeHash}`);

                // ⚡ CACHE CHECK (Compiled languages only)
                if (lang.compiler && fs.existsSync(binPath)) {
                    console.log(`[CodeRunner] Cache Hit: ${codeHash}`);
                    const runArgs = language === "text/x-java" ? ["-cp", tempDir, lang.className] : [];
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
                        // Use the Pre-compiled Header for God-speed
                        compileArgs.unshift("-include-pch", "/usr/include/c++/11/bits/stdc++.h.pch");
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
                        const runArgs = language === "text/x-java" ? ["Solution"] : [];

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
                // 🏠 LOCAL MODE: Direct Host (Fastest for dev)
                if (lang.compiler) {
                    const outBin = process.platform === 'win32' ? 'main.exe' : './main';
                    execFile(lang.compiler, [fileName, "-o", "main", "-O0"], { cwd: jobDir, timeout: 10000 }, (cErr) => {
                        if (cErr) {
                            cleanup(jobDir);
                            return resolve({ success: false, output: "", error: "Compilation Error: " + cErr.message, executionTime: Date.now() - startTime });
                        }
                        execFile(outBin, [], { cwd: jobDir, timeout: 5000 }, (rErr, rOut, rErrOut) => {
                            const totalTime = Date.now() - startTime;
                            cleanup(jobDir);
                            if (rErr) return resolve({ success: false, output: rOut, error: "Runtime Error:\n" + (rErrOut || rErr.message), executionTime: totalTime });
                            resolve({ success: true, output: rOut, error: null, executionTime: totalTime });
                        });
                    });
                } else {
                    execFile(lang.runner, [fileName], { cwd: jobDir, timeout: 5000 }, (rErr, rOut, rErrOut) => {
                        const totalTime = Date.now() - startTime;
                        cleanup(jobDir);
                        if (rErr) return resolve({ success: false, output: rOut, error: "Runtime Error:\n" + (rErrOut || rErr.message), executionTime: totalTime });
                        resolve({ success: true, output: rOut, error: null, executionTime: totalTime });
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
