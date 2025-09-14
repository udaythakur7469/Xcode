"use client";

import React, { useEffect, useState } from "react";
import { BookOpenCheck, PencilLine } from "lucide-react";
import { useUserStore } from "@/features/userStore";
import { ClipLoader } from "react-spinners";
import InstitutionDialogBox from "../helperComponents/dialogBoxes/InstitutionDialogBox";
import { Button } from "@/components/ui/button";

type EditProfileBarProps = {};

const EditProfileBar: React.FC<EditProfileBarProps> = () => {
  const { solvedLanguages, fetchSolvedLanguages, isLoading, userData } =
    useUserStore();

  const [showInstitutionDialogBox, setShowInstitutionDialogBox] =
    useState<boolean>(false);

  useEffect(() => {
    fetchSolvedLanguages();
  }, [fetchSolvedLanguages]);

  const college = userData?.institution;

  if (isLoading) {
    return (
      <div className="bg-accent border h-full w-full rounded-xl flex items-center justify-center">
        <ClipLoader size={50} color="#ffffff" />
      </div>
    );
  }

  return (
    <>
      <div className="bg-accent h-full w-full border rounded-xl p-2 relative">
        <div className="ml-3 mt-2 flex flex-col justify-center">
          <p className="text-2xl flex flex-row items-center">
            Languages used <BookOpenCheck className="h-4 w-4 ml-4" />
          </p>
          <div className="mt-2">
            {solvedLanguages?.map(({ language }) => (
              <div key={language}>{language}</div>
            ))}
          </div>
        </div>
        <div className="ml-3 mt-2 flex flex-col justify-center">
          {college ? (
            <div>
              <div className="text-2xl flex flex-row items-center">
                Institution{" "}
                <Button
                  variant="ghost"
                  onClick={() => setShowInstitutionDialogBox(true)}
                  className="text-2xl"
                >
                  <PencilLine />
                </Button>
              </div>
              <p className="text-lg mt-3">{college}</p>
            </div>
          ) : (
            <p className="text-2xl flex flex-row items-center">
              Add Institution{" "}
              <PencilLine
                className="ml-7"
                onClick={() => setShowInstitutionDialogBox(true)}
              />
            </p>
          )}
        </div>
        <InstitutionDialogBox
          isOpen={showInstitutionDialogBox}
          onClose={setShowInstitutionDialogBox}
        />
      </div>
    </>
  );
};

export default EditProfileBar;
