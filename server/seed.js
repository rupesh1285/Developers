require('dotenv').config();
const mongoose = require('mongoose');
const Problem = require('./models/Problem');

const problemsBatch6 = [
  // --- THE 5 BASICS (Bit Manipulation, Math, Arrays) ---
  {
    title: "Search Insert Position",
    difficulty: "Basic",
    description: "Given a sorted array of distinct integers and a target value, return the index if the target is found. If not, return the index where it would be if it were inserted in order. You must write an algorithm with O(log n) runtime complexity.",
    timeComplexity: "O(log n)",
    spaceComplexity: "O(1)",
    examples: [
      { input: "nums = [1,3,5,6], target = 5", output: "2", explanation: "5 is found at index 2." },
      { input: "nums = [1,3,5,6], target = 2", output: "1", explanation: "2 is not found, but would be inserted at index 1." },
      { input: "nums = [1,3,5,6], target = 7", output: "4", explanation: "7 is greater than all elements, so it goes at the end." }
    ]
  },
  {
    title: "Squares of a Sorted Array",
    difficulty: "Basic",
    description: "Given an integer array nums sorted in non-decreasing order, return an array of the squares of each number sorted in non-decreasing order.",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    examples: [
      { input: "nums = [-4,-1,0,3,10]", output: "[0,1,9,16,100]", explanation: "After squaring, the array becomes [16,1,0,9,100]. After sorting, it becomes [0,1,9,16,100]." },
      { input: "nums = [-7,-3,2,3,11]", output: "[4,9,9,49,121]", explanation: "Negative numbers become positive and shift the sorted order." },
      { input: "nums = [1,2,3]", output: "[1,4,9]", explanation: "Already positive array simply squares in place." }
    ]
  },
  {
    title: "Reverse Bits",
    difficulty: "Basic",
    description: "Reverse bits of a given 32 bits unsigned integer.",
    timeComplexity: "O(1)",
    spaceComplexity: "O(1)",
    examples: [
      { input: "n = 00000010100101000001111010011100", output: "964176192", explanation: "The input binary string reverses to 00111001011110000010100101000000, which is 964176192." },
      { input: "n = 11111111111111111111111111111101", output: "3221225471", explanation: "The reversed string is 10111111111111111111111111111111." },
      { input: "n = 0", output: "0", explanation: "Reversing all zeros results in zero." }
    ]
  },
  {
    title: "Hamming Distance",
    difficulty: "Basic",
    description: "The Hamming distance between two integers is the number of positions at which the corresponding bits are different. Given two integers x and y, return the Hamming distance between them.",
    timeComplexity: "O(1)",
    spaceComplexity: "O(1)",
    examples: [
      { input: "x = 1, y = 4", output: "2", explanation: "1 is 0001, 4 is 0100. The second and fifth bits differ." },
      { input: "x = 3, y = 1", output: "1", explanation: "3 is 0011, 1 is 0001. Only the second bit differs." },
      { input: "x = 0, y = 0", output: "0", explanation: "No bits differ." }
    ]
  },
  {
    title: "Valid Perfect Square",
    difficulty: "Basic",
    description: "Given a positive integer num, write a function which returns True if num is a perfect square else False. Do not use any built-in library function such as sqrt.",
    timeComplexity: "O(log n)",
    spaceComplexity: "O(1)",
    examples: [
      { input: "num = 16", output: "true", explanation: "We return true because 4 * 4 = 16." },
      { input: "num = 14", output: "false", explanation: "We return false because 14 is not a perfect square." },
      { input: "num = 1", output: "true", explanation: "1 * 1 = 1." }
    ]
  },

  // --- THE 15 MIXED (Advanced Trees, Strings, Arrays) ---
  {
    title: "Maximum Average Subarray I",
    difficulty: "Easy",
    description: "You are given an integer array nums consisting of n elements, and an integer k. Find a contiguous subarray whose length is equal to k that has the maximum average value and return this value.",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    examples: [
      { input: "nums = [1,12,-5,-6,50,3], k = 4", output: "12.75000", explanation: "Maximum average is (12 - 5 - 6 + 50) / 4 = 51 / 4 = 12.75." },
      { input: "nums = [5], k = 1", output: "5.00000", explanation: "Only one element to average." },
      { input: "nums = [-1,-2,-3,-4], k = 2", output: "-1.50000", explanation: "The highest average from negative numbers is the closest to zero." }
    ]
  },
  {
    title: "Find All Numbers Disappeared in an Array",
    difficulty: "Easy",
    description: "Given an array nums of n integers where nums[i] is in the range [1, n], return an array of all the integers in the range [1, n] that do not appear in nums.",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    examples: [
      { input: "nums = [4,3,2,7,8,2,3,1]", output: "[5,6]", explanation: "5 and 6 are missing from the 1 to 8 range." },
      { input: "nums = [1,1]", output: "[2]", explanation: "2 is missing from the 1 to 2 range." },
      { input: "nums = [1,2,3]", output: "[]", explanation: "No numbers are missing." }
    ]
  },
  {
    title: "Swap Nodes in Pairs",
    difficulty: "Medium",
    description: "Given a linked list, swap every two adjacent nodes and return its head. You must solve the problem without modifying the values in the list's nodes (i.e., only nodes themselves may be changed.)",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    examples: [
      { input: "head = [1,2,3,4]", output: "[2,1,4,3]", explanation: "1 and 2 swap, 3 and 4 swap." },
      { input: "head = []", output: "[]", explanation: "Empty list remains empty." },
      { input: "head = [1]", output: "[1]", explanation: "Single node cannot swap, remains unchanged." }
    ]
  },
  {
    title: "Populating Next Right Pointers in Each Node",
    difficulty: "Medium",
    description: "You are given a perfect binary tree where all leaves are on the same level, and every parent has two children. Populate each next pointer to point to its next right node. If there is no next right node, the next pointer should be set to null.",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    examples: [
      { input: "root = [1,2,3,4,5,6,7]", output: "[1,#,2,3,#,4,5,6,7,#]", explanation: "The serialized output shows level connections ending with #." },
      { input: "root = []", output: "[]", explanation: "Empty tree." },
      { input: "root = [1,2,3]", output: "[1,#,2,3,#]", explanation: "Basic tree connections." }
    ]
  },
  {
    title: "Path Sum II",
    difficulty: "Medium",
    description: "Given the root of a binary tree and an integer targetSum, return all root-to-leaf paths where the sum of the node values in the path equals targetSum. Each path should be returned as a list of the node values, not node references.",
    timeComplexity: "O(n^2)",
    spaceComplexity: "O(H)",
    examples: [
      { input: "root = [5,4,8,11,null,13,4,7,2,null,null,5,1], targetSum = 22", output: "[[5,4,11,2],[5,8,4,5]]", explanation: "Two paths sum up to 22." },
      { input: "root = [1,2,3], targetSum = 5", output: "[]", explanation: "No path sums to 5." },
      { input: "root = [1,2], targetSum = 0", output: "[]", explanation: "No path matches the sum." }
    ]
  },
  {
    title: "Flatten Binary Tree to Linked List",
    difficulty: "Medium",
    description: "Given the root of a binary tree, flatten the tree into a \"linked list\": The \"linked list\" should use the same TreeNode class where the right child pointer points to the next node in the list and the left child pointer is always null.",
    timeComplexity: "O(n)",
    spaceComplexity: "O(H)",
    examples: [
      { input: "root = [1,2,5,3,4,null,6]", output: "[1,null,2,null,3,null,4,null,5,null,6]", explanation: "The tree is flattened using preorder traversal order." },
      { input: "root = []", output: "[]", explanation: "Empty tree." },
      { input: "root = [0]", output: "[0]", explanation: "Single node tree." }
    ]
  },
  {
    title: "Combination Sum II",
    difficulty: "Medium",
    description: "Given a collection of candidate numbers (candidates) and a target number (target), find all unique combinations in candidates where the candidate numbers sum to target. Each number in candidates may only be used once in the combination.",
    timeComplexity: "O(2^n)",
    spaceComplexity: "O(n)",
    examples: [
      { input: "candidates = [10,1,2,7,6,1,5], target = 8", output: "[[1,1,6],[1,2,5],[1,7],[2,6]]", explanation: "All unique combinations that sum to 8." },
      { input: "candidates = [2,5,2,1,2], target = 5", output: "[[1,2,2],[5]]", explanation: "Duplicates in input are handled to prevent duplicate combinations." },
      { input: "candidates = [2], target = 1", output: "[]", explanation: "Target cannot be reached." }
    ]
  },
  {
    title: "Minimum Number of Arrows to Burst Balloons",
    difficulty: "Medium",
    description: "There are some spherical balloons taped onto a flat wall that represents the XY-plane. The balloons are represented as a 2D integer array points where points[i] = [xstart, xend]. Return the minimum number of arrows that must be shot to burst all balloons.",
    timeComplexity: "O(n log n)",
    spaceComplexity: "O(1)",
    examples: [
      { input: "points = [[10,16],[2,8],[1,6],[7,12]]", output: "2", explanation: "Shoot an arrow at x = 6, bursting [2,8] and [1,6]. Shoot another at x = 11, bursting [10,16] and [7,12]." },
      { input: "points = [[1,2],[3,4],[5,6],[7,8]]", output: "4", explanation: "No overlapping balloons, so 4 arrows are needed." },
      { input: "points = [[1,2],[2,3],[3,4],[4,5]]", output: "2", explanation: "Arrows at x=2 and x=4 burst all balloons." }
    ]
  },
  {
    title: "Next Permutation",
    difficulty: "Medium",
    description: "A permutation of an array of integers is an arrangement of its members into a sequence or linear order. Given an array of integers nums, find the next permutation of nums. The replacement must be in place and use only constant extra memory.",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    examples: [
      { input: "nums = [1,2,3]", output: "[1,3,2]", explanation: "The next lexicographical arrangement is 1,3,2." },
      { input: "nums = [3,2,1]", output: "[1,2,3]", explanation: "Since it is the last permutation, it wraps around to the lowest." },
      { input: "nums = [1,1,5]", output: "[1,5,1]", explanation: "Handles duplicate values correctly." }
    ]
  },
  {
    title: "Multiply Strings",
    difficulty: "Medium",
    description: "Given two non-negative integers num1 and num2 represented as strings, return the product of num1 and num2, also represented as a string. You must not use any built-in BigInteger library or convert the inputs to integer directly.",
    timeComplexity: "O(m * n)",
    spaceComplexity: "O(m + n)",
    examples: [
      { input: "num1 = \"2\", num2 = \"3\"", output: "\"6\"", explanation: "2 * 3 = 6." },
      { input: "num1 = \"123\", num2 = \"456\"", output: "\"56088\"", explanation: "Multiplication follows standard mathematical carrying." },
      { input: "num1 = \"0\", num2 = \"9999\"", output: "\"0\"", explanation: "Any number multiplied by 0 is 0." }
    ]
  },
  {
    title: "Rotate List",
    difficulty: "Medium",
    description: "Given the head of a linked list, rotate the list to the right by k places.",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    examples: [
      { input: "head = [1,2,3,4,5], k = 2", output: "[4,5,1,2,3]", explanation: "Rotate 1 step: [5,1,2,3,4]. Rotate 2 steps: [4,5,1,2,3]." },
      { input: "head = [0,1,2], k = 4", output: "[2,0,1]", explanation: "k can be larger than the list length, requiring modulo arithmetic." },
      { input: "head = [], k = 1", output: "[]", explanation: "Empty list remains empty." }
    ]
  },
  {
    title: "Search in Rotated Sorted Array II",
    difficulty: "Medium",
    description: "There is an integer array nums sorted in non-decreasing order (not necessarily with distinct values). Given the array nums after the rotation and an integer target, return true if target is in nums, or false if it is not in nums.",
    timeComplexity: "O(n) worst case",
    spaceComplexity: "O(1)",
    examples: [
      { input: "nums = [2,5,6,0,0,1,2], target = 0", output: "true", explanation: "0 is present at index 3 and 4." },
      { input: "nums = [2,5,6,0,0,1,2], target = 3", output: "false", explanation: "3 is not in the array." },
      { input: "nums = [1,0,1,1,1], target = 0", output: "true", explanation: "Duplicates mean we cannot cleanly eliminate halves, requiring linear scans in worst cases." }
    ]
  },
  {
    title: "Largest Number",
    difficulty: "Medium",
    description: "Given a list of non-negative integers nums, arrange them such that they form the largest number and return it. Since the result may be very large, so you need to return a string instead of an integer.",
    timeComplexity: "O(n log n)",
    spaceComplexity: "O(n)",
    examples: [
      { input: "nums = [10,2]", output: "\"210\"", explanation: "\"2\" + \"10\" is larger than \"10\" + \"2\"." },
      { input: "nums = [3,30,34,5,9]", output: "\"9534330\"", explanation: "Strings are sorted based on custom concatenation rules." },
      { input: "nums = [0,0]", output: "\"0\"", explanation: "Multiple zeros must be returned as a single \"0\"." }
    ]
  },
  {
    title: "Insert Delete GetRandom O(1)",
    difficulty: "Medium",
    description: "Implement the RandomizedSet class. You must implement the functions of the class such that each function works in average O(1) time complexity.",
    timeComplexity: "O(1)",
    spaceComplexity: "O(n)",
    examples: [
      { input: "[\"RandomizedSet\", \"insert\", \"remove\", \"insert\", \"getRandom\"]\n[[], [1], [2], [2], []]", output: "[null, true, false, true, 2]", explanation: "Uses a combination of Hash Map and Array to maintain O(1) operations." },
      { input: "[\"RandomizedSet\",\"remove\"]\n[[],[0]]", output: "[null,false]", explanation: "Removing from an empty set returns false." },
      { input: "[\"RandomizedSet\",\"insert\",\"insert\",\"getRandom\"]\n[[],[1],[1],[]]", output: "[null,true,false,1]", explanation: "Inserting a duplicate returns false." }
    ]
  },
  {
    title: "Recover Binary Search Tree",
    difficulty: "Hard",
    description: "You are given the root of a binary search tree (BST), where the values of exactly two nodes of the tree were swapped by mistake. Recover the tree without changing its structure.",
    timeComplexity: "O(n)",
    spaceComplexity: "O(1) using Morris Traversal",
    examples: [
      { input: "root = [1,3,null,null,2]", output: "[3,1,null,null,2]", explanation: "3 cannot be a left child of 1 because 3 > 1. Swapping 1 and 3 makes the BST valid." },
      { input: "root = [3,1,4,null,null,2]", output: "[2,1,4,null,null,3]", explanation: "2 cannot be in the right subtree of 3. Swapping 2 and 3 recovers it." },
      { input: "root = [2,3,1]", output: "[2,1,3]", explanation: "Root's children were swapped." }
    ]
  }
];

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB. Preparing BONUS BATCH 6...");
    
    const lastProblem = await Problem.findOne().sort('-problemNumber');
    let nextNumber = (lastProblem && lastProblem.problemNumber) ? lastProblem.problemNumber + 1 : 1;
    
    console.log(`Current max problemNumber is ${nextNumber - 1}. Starting Bonus Batch from #${nextNumber}...`);

    shuffleArray(problemsBatch6);
    
    problemsBatch6.forEach(problem => {
        problem.problemNumber = nextNumber;
        nextNumber++;
    });
    
    try {
      await Problem.insertMany(problemsBatch6);
      console.log(`✅ Successfully seeded the bonus ${problemsBatch6.length} problems!`);
      console.log(`🎉 DATABASE NOW HOLDS 220 UNIQUE PROBLEMS!`);
    } catch (err) {
      console.error("❌ Error inserting problems:", err);
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error("Database connection error:", err);
    process.exit(1);
  });