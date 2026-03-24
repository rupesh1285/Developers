require("dotenv").config();
const mongoose = require("mongoose");
const Problem = require("./models/Problem"); // Adjust path if your models folder is elsewhere

// =========================================================
// 1. 15 ULTRA-DETAILED CLASSIC PROBLEMS
// =========================================================
const detailedProblems = [
    {
        title: "Two Sum", difficulty: "Basic",
        description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.",
        examples: [
            { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
            { input: "nums = [3,2,4], target = 6", output: "[1,2]" }
        ],
        constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "-10^9 <= target <= 10^9"],
        timeComplexity: "O(n)", spaceComplexity: "O(n)",
        tags: ["Array", "Hash Table"]
    },
    {
        title: "Trapping Rain Water", difficulty: "Hard",
        description: "Given `n` non-negative integers representing an elevation map where the width of each bar is `1`, compute how much water it can trap after raining.",
        examples: [
            { input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]", output: "6", explanation: "6 units of rain water are being trapped." }
        ],
        constraints: ["n == height.length", "1 <= n <= 2 * 10^4", "0 <= height[i] <= 10^5"],
        timeComplexity: "O(n)", spaceComplexity: "O(1)",
        tags: ["Array", "Two Pointers", "Dynamic Programming", "Stack"]
    },
    {
        title: "LRU Cache", difficulty: "Medium",
        description: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.\n\nImplement the `LRUCache` class:\n- `LRUCache(int capacity)` Initialize the LRU cache with positive size capacity.\n- `int get(int key)` Return the value of the key if the key exists, otherwise return -1.",
        examples: [
            { input: "[\"LRUCache\", \"put\", \"put\", \"get\"]\n[[2], [1, 1], [2, 2], [1]]", output: "[null, null, null, 1]", explanation: "Cache logic operations." }
        ],
        constraints: ["1 <= capacity <= 3000", "0 <= key <= 10^4", "0 <= value <= 10^5"],
        timeComplexity: "O(1)", spaceComplexity: "O(capacity)",
        tags: ["Hash Table", "Linked List", "Design", "Doubly-Linked List"]
    },
    {
        title: "Valid Palindrome", difficulty: "Easy",
        description: "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.\n\nGiven a string `s`, return `true` if it is a palindrome, or `false` otherwise.",
        examples: [
            { input: "s = \"A man, a plan, a canal: Panama\"", output: "true", explanation: "\"amanaplanacanalpanama\" is a palindrome." },
            { input: "s = \"race a car\"", output: "false", explanation: "\"raceacar\" is not a palindrome." }
        ],
        timeComplexity: "O(n)", spaceComplexity: "O(1)",
        tags: ["Two Pointers", "String"]
    },
    {
        title: "Merge K Sorted Lists", difficulty: "Hard",
        description: "You are given an array of `k` linked-lists `lists`, each linked-list is sorted in ascending order.\n\nMerge all the linked-lists into one sorted linked-list and return it.",
        examples: [
            { input: "lists = [[1,4,5],[1,3,4],[2,6]]", output: "[1,1,2,3,4,4,5,6]", explanation: "The linked-lists are merged into one sorted list." }
        ],
        timeComplexity: "O(N log k)", spaceComplexity: "O(k)",
        tags: ["Linked List", "Divide and Conquer", "Heap (Priority Queue)", "Merge Sort"]
    },
    {
        title: "Reverse String", difficulty: "Basic",
        description: "Write a function that reverses a string. The input string is given as an array of characters `s`.\n\nYou must do this by modifying the input array in-place with O(1) extra memory.",
        examples: [
            { input: "s = [\"h\",\"e\",\"l\",\"l\",\"o\"]", output: "[\"o\",\"l\",\"l\",\"e\",\"h\"]" }
        ],
        timeComplexity: "O(n)", spaceComplexity: "O(1)",
        tags: ["Two Pointers", "String"]
    },
    {
        title: "Find First and Last Position of Element in Sorted Array", difficulty: "Medium",
        description: "Given an array of integers `nums` sorted in non-decreasing order, find the starting and ending position of a given `target` value.\n\nIf `target` is not found in the array, return `[-1, -1]`.",
        examples: [
            { input: "nums = [5,7,7,8,8,10], target = 8", output: "[3,4]" },
            { input: "nums = [5,7,7,8,8,10], target = 6", output: "[-1,-1]" }
        ],
        timeComplexity: "O(log n)", spaceComplexity: "O(1)",
        tags: ["Array", "Binary Search"]
    },
    {
        title: "Maximum Subarray", difficulty: "Medium",
        description: "Given an integer array `nums`, find the subarray with the largest sum, and return its sum.",
        examples: [
            { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", explanation: "The subarray [4,-1,2,1] has the largest sum 6." }
        ],
        timeComplexity: "O(n)", spaceComplexity: "O(1)",
        tags: ["Array", "Divide and Conquer", "Dynamic Programming"]
    },
    {
        title: "Climbing Stairs", difficulty: "Easy",
        description: "You are climbing a staircase. It takes `n` steps to reach the top.\n\nEach time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
        examples: [
            { input: "n = 2", output: "2", explanation: "1. 1 step + 1 step\n2. 2 steps" },
            { input: "n = 3", output: "3", explanation: "1. 1 step + 1 step + 1 step\n2. 1 step + 2 steps\n3. 2 steps + 1 step" }
        ],
        timeComplexity: "O(n)", spaceComplexity: "O(1)",
        tags: ["Math", "Dynamic Programming", "Memoization"]
    },
    {
        title: "Contains Duplicate", difficulty: "Basic",
        description: "Given an integer array `nums`, return `true` if any value appears at least twice in the array, and return `false` if every element is distinct.",
        examples: [
            { input: "nums = [1,2,3,1]", output: "true" },
            { input: "nums = [1,2,3,4]", output: "false" }
        ],
        timeComplexity: "O(n)", spaceComplexity: "O(n)",
        tags: ["Array", "Hash Table", "Sorting"]
    },
    {
        title: "Median of Two Sorted Arrays", difficulty: "Hard",
        description: "Given two sorted arrays `nums1` and `nums2` of size `m` and `n` respectively, return the median of the two sorted arrays.",
        examples: [
            { input: "nums1 = [1,3], nums2 = [2]", output: "2.00000", explanation: "merged array = [1,2,3] and median is 2." }
        ],
        timeComplexity: "O(log (m+n))", spaceComplexity: "O(1)",
        tags: ["Array", "Binary Search", "Divide and Conquer"]
    },
    {
        title: "Word Search", difficulty: "Medium",
        description: "Given an `m x n` grid of characters `board` and a string `word`, return `true` if `word` exists in the grid.\n\nThe word can be constructed from letters of sequentially adjacent cells, where adjacent cells are horizontally or vertically neighboring.",
        examples: [
            { input: "board = [[\"A\",\"B\",\"C\",\"E\"],[\"S\",\"F\",\"C\",\"S\"],[\"A\",\"D\",\"E\",\"E\"]], word = \"ABCCED\"", output: "true" }
        ],
        timeComplexity: "O(m * n * 4^word.length)", spaceComplexity: "O(word.length)",
        tags: ["Array", "Backtracking", "Matrix"]
    },
    {
        title: "Binary Tree Level Order Traversal", difficulty: "Medium",
        description: "Given the `root` of a binary tree, return the level order traversal of its nodes' values. (i.e., from left to right, level by level).",
        examples: [
            { input: "root = [3,9,20,null,null,15,7]", output: "[[3],[9,20],[15,7]]" }
        ],
        timeComplexity: "O(n)", spaceComplexity: "O(n)",
        tags: ["Tree", "Breadth-First Search", "Binary Tree"]
    },
    {
        title: "N-Queens", difficulty: "Hard",
        description: "The n-queens puzzle is the problem of placing `n` queens on an `n x n` chessboard such that no two queens attack each other.\n\nGiven an integer `n`, return all distinct solutions to the n-queens puzzle.",
        examples: [
            { input: "n = 4", output: "[[\".Q..\",\"...Q\",\"Q...\",\"..Q.\"],[\"..Q.\",\"Q...\",\"...Q\",\".Q..\"]]" }
        ],
        timeComplexity: "O(n!)", spaceComplexity: "O(n^2)",
        tags: ["Array", "Backtracking"]
    },
    {
        title: "Best Time to Buy and Sell Stock", difficulty: "Easy",
        description: "You are given an array `prices` where `prices[i]` is the price of a given stock on the `ith` day.\n\nYou want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.",
        examples: [
            { input: "prices = [7,1,5,3,6,4]", output: "5", explanation: "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5." }
        ],
        timeComplexity: "O(n)", spaceComplexity: "O(1)",
        tags: ["Array", "Dynamic Programming"]
    }
];

// =========================================================
// 2. THE GENERATOR: 35 REALISTIC MOCK PROBLEMS
// =========================================================
const mockTitles = [
    "3Sum", "Container With Most Water", "Longest Common Prefix", "3Sum Closest",
    "Letter Combinations of a Phone Number", "Remove Nth Node From End of List", "Valid Parentheses",
    "Merge Two Sorted Lists", "Generate Parentheses", "Swap Nodes in Pairs", "Reverse Nodes in k-Group",
    "Remove Duplicates from Sorted Array", "Remove Element", "Implement strStr()", "Divide Two Integers",
    "Substring with Concatenation of All Words", "Next Permutation", "Longest Valid Parentheses",
    "Search in Rotated Sorted Array", "Search Insert Position", "Valid Sudoku", "Sudoku Solver",
    "Count and Say", "Combination Sum", "Combination Sum II", "First Missing Positive",
    "Multiply Strings", "Wildcard Matching", "Jump Game II", "Permutations", "Permutations II",
    "Rotate Image", "Group Anagrams", "Pow(x, n)", "Spiral Matrix"
];

const mockTagsList = [
    ["Array", "Two Pointers", "Sorting"], ["String", "Trie"], ["Linked List", "Recursion"],
    ["Math", "Binary Search"], ["Dynamic Programming", "String"], ["Hash Table", "String"],
    ["Backtracking", "Array"], ["Matrix", "Math"], ["Greedy", "Array"], ["Stack", "String"]
];

const difficulties = ["Basic", "Easy", "Medium", "Medium", "Medium", "Hard"];

const generatedProblems = mockTitles.map((title, index) => {
    const diff = difficulties[Math.floor(Math.random() * difficulties.length)];
    const tags = mockTagsList[index % mockTagsList.length];

    return {
        title: title,
        difficulty: diff,
        description: `This is a generated description for **${title}**.\n\nIn this problem, you will need to utilize concepts related to ${tags.join(" and ")}. Write an efficient algorithm to solve the problem within the given constraints.`,
        examples: [
            { input: "sample_input = [1, 2, 3]", output: "sample_output = 6", explanation: "This is a mock explanation for the generated problem." }
        ],
        constraints: ["1 <= input.length <= 10^5", "Time limit: 2 seconds"],
        timeComplexity: diff === "Hard" ? "O(n log n)" : "O(n)",
        spaceComplexity: "O(n)",
        tags: tags
    };
});

// Combine both arrays
const allProblems = [...detailedProblems, ...generatedProblems];

// =========================================================
// 3. THE EXECUTION ENGINE
// =========================================================
const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        // Connect to MongoDB
        console.log("⏳ Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/finalist");
        console.log("✅ MongoDB Connected!");

        // Clear existing problems
        console.log("🧹 Clearing old problems from database...");
        await Problem.deleteMany({});
        console.log("✅ Database cleared.");

        // Assign serial numbers dynamically
        console.log(`🚀 Injecting ${allProblems.length} real problems...`);
        const formattedProblems = allProblems.map((p, index) => ({
            ...p,
            problemNumber: index + 1
        }));

        // Insert into database
        await Problem.insertMany(formattedProblems);
        console.log("🎉 SEEDING COMPLETE! 50 Problems successfully injected.");

        // Close connection
        mongoose.connection.close();
        process.exit();

    } catch (error) {
        console.error("❌ SEEDING FAILED:", error);
        process.exit(1);
    }
};

seedDatabase();