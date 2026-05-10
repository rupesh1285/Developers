const { runCppCode } = require('./services/codeRunner');

async function test() {
    console.log("Starting code runner test...");
    
    const cppCode = `
    #include <iostream>
    using namespace std;
    
    int main() {
        cout << "Hello from Docker!" << endl;
        return 0;
    }
    `;

    try {
        const result = await runCppCode(cppCode);
        console.log("=== EXECUTION RESULT ===");
        console.log(JSON.stringify(result, null, 2));
    } catch (err) {
        console.error("Test failed:", err);
    }
}

test();
