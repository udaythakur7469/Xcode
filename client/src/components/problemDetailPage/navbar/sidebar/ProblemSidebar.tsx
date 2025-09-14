import React from "react";
import { ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProblemTable from "./problemTable/ProblemTable";
import { useRouter } from "next/navigation";

type ProblemSidebarProps = {
  onClose: () => void;
  isOpen: boolean;
};

const ProblemSidebar: React.FC<ProblemSidebarProps> = ({ onClose, isOpen }) => {
  const router = useRouter();

  const takeToProblemsPage = () => {
    router.push("/problems");
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            key="sidebar"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed top-0 left-0 h-full w-[600px] bg-background border-r shadow-lg z-50"
          >
            <div
              className="h-20 border-b flex flex-row justify-start items-center cursor-pointer"
              onClick={takeToProblemsPage}
            >
              <div className="text-5xl ml-4">Problems list</div>
              <ChevronRight className="ml-4" size="50" />
            </div>
            <div>
              <ProblemTable />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProblemSidebar;
