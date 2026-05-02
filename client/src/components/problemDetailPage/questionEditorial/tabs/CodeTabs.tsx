import React from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/editorialCodeTabs";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

type CodeTabsProps = {
  cppCode: string;
  jsCode: string;
  pythonCode: string;
  javaCode: string;
};

const CodeTabs: React.FC<CodeTabsProps> = ({
  cppCode,
  jsCode,
  pythonCode,
  javaCode,
}) => {
  return (
    <div className="w-full h-full">
      <Tabs
        defaultValue="Cpp"
        className="h-full w-full border-green-600 border-[3px] rounded-md"
      >
        <TabsList className="w-full flex flex-row justify-stretch ">
          <TabsTrigger value="Cpp" className="flex-1 text-center ">
            Cpp
          </TabsTrigger>
          <TabsTrigger value="Java" className="flex-1 text-center ">
            Java
          </TabsTrigger>
          <TabsTrigger value="Python" className="flex-1 text-center ">
            Python
          </TabsTrigger>
          <TabsTrigger value="JS" className="flex-1 text-center ">
            JS
          </TabsTrigger>
        </TabsList>
        {/* C++ Tab */}
        <TabsContent value="Cpp" className="text-black">
          <div className="overflow-auto max-h-[40vh]">
            <SyntaxHighlighter
              language="cpp"
              style={vscDarkPlus}
              showLineNumbers
              customStyle={{
                borderRadius: "8px",
                padding: "16px",
                fontSize: "16px",
              }}
            >
              {cppCode}
            </SyntaxHighlighter>
          </div>
        </TabsContent>

        {/* Java Tab */}
        <TabsContent value="Java" className="text-black">
          <div className="overflow-auto max-h-[40vh]">
            <SyntaxHighlighter
              language="java"
              style={vscDarkPlus}
              showLineNumbers
              customStyle={{
                borderRadius: "8px",
                padding: "16px",
                fontSize: "16px",
              }}
            >
              {javaCode}
            </SyntaxHighlighter>
          </div>
        </TabsContent>

        {/* Python Tab */}
        <TabsContent value="Python" className="text-black">
          <div className="overflow-auto max-h-[40vh]">
            <SyntaxHighlighter
              language="python"
              style={vscDarkPlus}
              showLineNumbers
              customStyle={{
                borderRadius: "8px",
                padding: "16px",
                fontSize: "16px",
              }}
            >
              {pythonCode}
            </SyntaxHighlighter>
          </div>
        </TabsContent>

        {/* JavaScript Tab */}
        <TabsContent value="JS" className="text-black">
          <div className="overflow-auto max-h-[40vh]">
            <SyntaxHighlighter
              language="javascript"
              style={vscDarkPlus}
              showLineNumbers
              customStyle={{
                borderRadius: "8px",
                padding: "16px",
                fontSize: "16px",
              }}
            >
              {jsCode}
            </SyntaxHighlighter>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default CodeTabs;
