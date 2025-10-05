export const getPostTemplate = (code, language) => `# Intuition
<!-- Describe your first thoughts or logic behind solving this problem. What pattern or idea came to mind first? -->


# Approach
<!-- Explain your approach step by step. Mention how you tackled edge cases, data structures used, and how your approach evolves into the final solution. -->


# Complexity

- **Time Complexity:** 
<!-- Add your time complexity here, e.g. O(n log n) -->

- **Space Complexity:** 
<!-- Add your space complexity here, e.g. O(n) -->


# Code
\`\`\`${language}
${code}
\`\`\`


# Explanation of Code
<!-- Briefly explain key parts of your code, like important loops, conditions, or data structure usage. -->

`;
