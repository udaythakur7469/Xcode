export const getPostTemplate = (
  code: string,
  language: string,
) => `# 🚀 Problem Overview

## 📌 Problem Statement
> Write the problem in your own words. Focus on what is being asked, not copying the full description.

## 🔗 References
- Add problem link here: [Problem Link](url)
- Add any helpful resources (articles, discussions, etc.)

---

# 💡 Intuition
<!-- Explain your first thoughts. What pattern, trick, or idea came to your mind when you saw the problem? -->

> Tip: Mention *why* your approach should work before jumping into implementation.

---

# 🧠 Approach

## Step-by-step Strategy
<!-- Break your solution into clear steps -->

1. Describe step 1
2. Describe step 2
3. Describe step 3

## Key Decisions
<!-- Explain important choices like data structures, algorithms, or optimizations -->

- Why did you choose this approach?
- What alternatives did you consider?

---

# ⚙️ Implementation Details

## 🧩 Data Structures Used
<!-- List and explain structures used -->

* Structure 1 — why it's used
* Structure 2 — why it's used

## 🔁 Algorithm Flow
<!-- Describe how the code executes step-by-step -->

1. Initialization
2. Processing logic
3. Final result

---

# ⏱ Complexity Analysis

| Type            | Complexity |
|-----------------|------------|
| Time Complexity | <!-- e.g. O(n log n) --> |
| Space Complexity| <!-- e.g. O(n) --> |

---

# 💻 Code

\`\`\`${language}
${code}
\`\`\`

---

# 🔍 Code Explanation

## Key Snippets
<!-- Highlight important parts of your code -->

\`\`\`
Paste small relevant snippet here
\`\`\`

### Explanation
<!-- Explain what the above snippet does and why it's important -->

> Tip: Focus on logic, not syntax.

---

# 📊 Example Walkthrough

## Input
\`\`\`
Add sample input here
\`\`\`

## Output
\`\`\`
Add expected output here
\`\`\`

## Explanation
<!-- Walk through the example step-by-step -->

---

# ⚠️ Edge Cases

<!-- List all edge cases your solution handles -->

* Case 1 — explanation
* Case 2 — explanation
* Case 3 — explanation

---

# 🔗 Related Problems

1. [Problem Name](url)
2. [Problem Name](url)

---

# 🧪 Testing

## Test Cases

| Input | Output | Notes |
|-------|--------|-------|
|       |        |       |
|       |        |       |

---

# 📷 Visualization (Optional)

![Add diagram, dry run screenshot, or flow visualization](image-url)

---

# 📝 Notes

<!-- Add any additional thoughts, optimizations, or learnings -->

- Observation 1
- Observation 2

---

# 📌 Alternative Approaches

## Approach 1
<!-- Describe another possible solution -->

\`\`\`
Add pseudocode or idea
\`\`\`

## Approach 2
<!-- Optional -->

---

# ❓ Discussion

> What improvements or alternative ideas can be applied to this problem?

---

# 📚 Summary

<!-- Summarize your solution in a few bullet points -->

- Key takeaway 1
- Key takeaway 2
- Key takeaway 3

---
`;
