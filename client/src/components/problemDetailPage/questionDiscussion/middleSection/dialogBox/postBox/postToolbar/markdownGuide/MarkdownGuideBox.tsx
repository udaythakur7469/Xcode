import React from "react";

type MarkdownGuideBoxProps = {};

const MarkdownGuideBox: React.FC<MarkdownGuideBoxProps> = () => {
  return (
    <div className="max-h-[75vh] overflow-y-auto px-8 py-6 scrollbar-transparent">
      {/* Main Title */}
      <h1 className="text-4xl font-bold mb-4">
        Markdown Editor Toolbar – Complete Usage Guide
      </h1>
      
      <p className="text-muted-foreground mb-6 leading-relaxed text-base">
        This editor uses <strong>Markdown</strong>, a lightweight syntax for formatting text. 
        The toolbar provides quick shortcuts to insert common Markdown patterns without memorizing syntax.
      </p>
      
      <p className="text-muted-foreground mb-10 leading-relaxed text-base">
        Below is a <strong>detailed explanation of every button</strong>, what it does, and how to use it effectively.
      </p>

      <hr className="my-8 border-border" />

      {/* Text Formatting Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-2xl">✍️</span> Text Formatting
        </h2>

        {/* Bold */}
        <div className="mb-10">
          <h3 className="text-2xl font-semibold mb-4">
            Bold (<code className="text-sm bg-secondary px-3 py-1.5 rounded">B</code>)
          </h3>
          
          <p className="text-muted-foreground mb-3 text-base leading-relaxed">
            <strong>What it does:</strong> Makes text bold.
          </p>
          
          <p className="text-muted-foreground mb-3 text-base leading-relaxed">
            <strong>Markdown syntax:</strong>
          </p>
          <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
            <code>**bold text**</code>
          </pre>
          
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <p className="text-sm text-muted-foreground mb-2 font-semibold">Result:</p>
            <p className="text-base"><strong>bold text</strong></p>
          </div>
          
          <p className="text-muted-foreground mb-3 text-base leading-relaxed">
            <strong>How to use:</strong>
          </p>
          <ul className="list-disc list-inside text-muted-foreground mb-4 ml-6 space-y-2 text-base leading-relaxed">
            <li>Select text and click <strong>Bold</strong>, or</li>
            <li>Click the button and type between the <code className="text-sm bg-secondary px-2 py-1 rounded">** **</code>.</li>
          </ul>
          
          <p className="text-muted-foreground mb-3 text-base leading-relaxed">
            <strong>Example:</strong>
          </p>
          <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
            <code>This is **important** information.</code>
          </pre>
          
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <p className="text-sm text-muted-foreground mb-2 font-semibold">Result:</p>
            <p className="text-base">This is <strong>important</strong> information.</p>
          </div>
        </div>

        {/* Italic */}
        <div className="mb-10">
          <h3 className="text-2xl font-semibold mb-4">
            Italic (<code className="text-sm bg-secondary px-3 py-1.5 rounded">I</code>)
          </h3>
          
          <p className="text-muted-foreground mb-3 text-base leading-relaxed">
            <strong>What it does:</strong> Italicizes text.
          </p>
          
          <p className="text-muted-foreground mb-3 text-base leading-relaxed">
            <strong>Markdown syntax:</strong>
          </p>
          <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
            <code>*italic text*</code>
          </pre>
          
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <p className="text-sm text-muted-foreground mb-2 font-semibold">Result:</p>
            <p className="text-base"><em>italic text</em></p>
          </div>
          
          <p className="text-muted-foreground mb-3 text-base leading-relaxed">
            <strong>Example:</strong>
          </p>
          <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
            <code>This is *emphasized* text.</code>
          </pre>
          
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <p className="text-sm text-muted-foreground mb-2 font-semibold">Result:</p>
            <p className="text-base">This is <em>emphasized</em> text.</p>
          </div>
        </div>
      </section>

      <hr className="my-8 border-border" />

      {/* Headings Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-2xl">🏷️</span> Headings
        </h2>
        
        <p className="text-muted-foreground mb-6 text-base leading-relaxed">
          Headings help structure your post and improve readability.
        </p>

        {/* H1 */}
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-4">Heading 1 (H1)</h3>
          <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
            <code># Heading 1</code>
          </pre>
          
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-3">
            <p className="text-sm text-muted-foreground mb-2 font-semibold">Result:</p>
            <h1 className="text-3xl font-bold">Heading 1</h1>
          </div>
          
          <p className="text-muted-foreground text-base leading-relaxed">Use for main titles.</p>
        </div>

        {/* H2 */}
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-4">Heading 2 (H2)</h3>
          <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
            <code>## Heading 2</code>
          </pre>
          
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-3">
            <p className="text-sm text-muted-foreground mb-2 font-semibold">Result:</p>
            <h2 className="text-2xl font-semibold">Heading 2</h2>
          </div>
          
          <p className="text-muted-foreground text-base leading-relaxed">Use for sections.</p>
        </div>

        {/* H3 */}
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-4">Heading 3 (H3)</h3>
          <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
            <code>### Heading 3</code>
          </pre>
          
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-3">
            <p className="text-sm text-muted-foreground mb-2 font-semibold">Result:</p>
            <h3 className="text-xl font-semibold">Heading 3</h3>
          </div>
          
          <p className="text-muted-foreground text-base leading-relaxed">Use for subsections.</p>
        </div>
      </section>

      <hr className="my-8 border-border" />

      {/* Lists Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-2xl">📋</span> Lists
        </h2>

        {/* Bullet List */}
        <div className="mb-10">
          <h3 className="text-2xl font-semibold mb-4">Bullet List</h3>
          <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
            <code>{`* Item one
* Item two
* Item three`}</code>
          </pre>
          
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <p className="text-sm text-muted-foreground mb-2 font-semibold">Result:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Item one</li>
              <li>Item two</li>
              <li>Item three</li>
            </ul>
          </div>
          
          <p className="text-muted-foreground text-base leading-relaxed">
            <strong>Tip:</strong> Use for unordered points.
          </p>
        </div>

        {/* Numbered List */}
        <div className="mb-10">
          <h3 className="text-2xl font-semibold mb-4">Numbered List</h3>
          <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
            <code>{`1. First step
2. Second step
3. Third step`}</code>
          </pre>
          
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <p className="text-sm text-muted-foreground mb-2 font-semibold">Result:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>First step</li>
              <li>Second step</li>
              <li>Third step</li>
            </ol>
          </div>
          
          <p className="text-muted-foreground text-base leading-relaxed">Markdown automatically numbers items.</p>
        </div>
      </section>

      <hr className="my-8 border-border" />

      {/* Code Formatting Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-2xl">💻</span> Code Formatting
        </h2>

        {/* Inline Code */}
        <div className="mb-10">
          <h3 className="text-2xl font-semibold mb-4">Inline Code</h3>
          
          <p className="text-muted-foreground mb-3 text-base leading-relaxed">
            <strong>What it does:</strong> Highlights short code snippets inside text.
          </p>
          
          <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
            <code>{`Use the \`map()\` function.`}</code>
          </pre>
          
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <p className="text-sm text-muted-foreground mb-2 font-semibold">Result:</p>
            <p className="text-base">Use the <code className="bg-secondary px-2 py-1 rounded text-sm">map()</code> function.</p>
          </div>
          
          <p className="text-muted-foreground text-base leading-relaxed">
            Best for function names, variables, or short expressions.
          </p>
        </div>

        {/* Code Block */}
        <div className="mb-10">
          <h3 className="text-2xl font-semibold mb-4">Code Block</h3>
          
          <p className="text-muted-foreground mb-3 text-base leading-relaxed">Used for multi-line code.</p>
          
          <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
            <code>{`\`\`\`
int twoSum(vector<int>& nums) {
  return 0;
}
\`\`\``}</code>
          </pre>
          
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <p className="text-sm text-muted-foreground mb-2 font-semibold">Result:</p>
            <pre className="bg-card border border-border p-3 rounded text-sm overflow-x-auto">
              <code>{`int twoSum(vector<int>& nums) {
  return 0;
}`}</code>
            </pre>
          </div>
          
          <p className="text-muted-foreground text-base leading-relaxed">
            <strong>Tip:</strong> Always use code blocks for solutions and examples.
          </p>
        </div>
      </section>

      <hr className="my-8 border-border" />

      {/* Quote Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-2xl">💬</span> Quote
        </h2>
        
        <p className="text-muted-foreground mb-4 text-base leading-relaxed">
          Used for notes, explanations, or highlighting important thoughts.
        </p>
        
        <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
          <code>{`> This is an important note.`}</code>
        </pre>
        
        <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
          <p className="text-sm text-muted-foreground mb-2 font-semibold">Result:</p>
          <blockquote className="border-l-4 border-border pl-4 italic">
            This is an important note.
          </blockquote>
        </div>
      </section>

      <hr className="my-8 border-border" />

      {/* Links & Images Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-2xl">🔗</span> Links & Images
        </h2>

        {/* Link */}
        <div className="mb-10">
          <h3 className="text-2xl font-semibold mb-4">Link</h3>
          <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
            <code>{`[Link Text](https://example.com)`}</code>
          </pre>
          
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <p className="text-sm text-muted-foreground mb-2 font-semibold">Result:</p>
            <a href="https://example.com" className="text-blue-600 underline hover:text-blue-800">Link Text</a>
          </div>
          
          <p className="text-muted-foreground mb-3 text-base leading-relaxed">
            <strong>Example:</strong>
          </p>
          <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
            <code>{`[Official Docs](https://leetcode.com)`}</code>
          </pre>
          
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <p className="text-sm text-muted-foreground mb-2 font-semibold">Result:</p>
            <a href="https://leetcode.com" className="text-blue-600 underline hover:text-blue-800">Official Docs</a>
          </div>
        </div>

        {/* Image */}
        <div className="mb-10">
          <h3 className="text-2xl font-semibold mb-4">Image</h3>
          <pre className="bg-card border border-border text-foreground p-5 rounded-md mb-3 overflow-x-auto font-mono text-sm">
            <code>{`![Alt text](image-url)`}</code>
          </pre>
          
          <div className="bg-secondary/50 border border-border p-4 rounded-md mb-4">
            <p className="text-sm text-muted-foreground mb-2 font-semibold">Result:</p>
            <div className="bg-muted p-2 rounded inline-block">
              <p className="text-sm text-muted-foreground italic">🖼️ [Image will be displayed here]</p>
            </div>
          </div>
          
          <p className="text-muted-foreground mb-3 text-base leading-relaxed">
            <strong>Example:</strong>
          </p>
          <pre className="bg-card border border-border text-foreground p-5 rounded-md overflow-x-auto font-mono text-sm">
            <code>{`![Two Sum Diagram](https://example.com/twosum.png)`}</code>
          </pre>
        </div>
      </section>

      <hr className="my-8 border-border" />

      {/* Reset Button Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-2xl">🔄</span> Reset Button
        </h2>
        
        <p className="text-muted-foreground mb-3 text-base leading-relaxed">
          <strong>What it does:</strong>
        </p>
        <ul className="list-disc list-inside text-muted-foreground ml-6 space-y-2 text-base leading-relaxed">
          <li>Resets the editor layout or content to its default state.</li>
          <li>Useful if the editor gets into an inconsistent layout or formatting state.</li>
        </ul>
      </section>

      <hr className="my-8 border-border" />

      {/* Markdown Guide Button Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-2xl">💡</span> Markdown Guide Button
        </h2>
        
        <p className="text-muted-foreground mb-4 text-base leading-relaxed">Opens this guide 📘</p>
        
        <p className="text-muted-foreground mb-3 text-base leading-relaxed">Use it whenever you:</p>
        <ul className="list-disc list-inside text-muted-foreground ml-6 space-y-2 text-base leading-relaxed">
          <li>Forget Markdown syntax</li>
          <li>Want to format posts professionally</li>
          <li>Need help structuring explanations</li>
        </ul>
      </section>

      <hr className="my-8 border-border" />

      {/* Best Practices Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
          <span className="text-2xl">✅</span> Best Practices for Writing Great Posts
        </h2>
        
        <ul className="list-disc list-inside text-muted-foreground ml-6 space-y-3 text-base leading-relaxed">
          <li>Use <strong>Headings</strong> to break sections</li>
          <li>Use <strong>Code Blocks</strong> for solutions</li>
          <li>Use <strong>Inline Code</strong> for variables & functions</li>
          <li>Avoid walls of text → use lists & quotes</li>
          <li>Keep explanations concise and readable</li>
        </ul>
      </section>

      <hr className="my-8 border-border" />

      {/* Footer */}
      <div className="text-center py-8">
        <p className="text-2xl font-semibold mb-3">Happy coding 🚀</p>
        <p className="text-muted-foreground text-base leading-relaxed">
          Markdown makes your solutions clearer, more professional, and easier to understand for others.
        </p>
      </div>
    </div>
  );
};

export default MarkdownGuideBox;