export var SolutionIntent;
(function (SolutionIntent) {
    SolutionIntent["FULL_SOLUTION"] = "FULL_SOLUTION";
    SolutionIntent["PARTIAL_HELP"] = "PARTIAL_HELP";
    SolutionIntent["CONCEPTUAL"] = "CONCEPTUAL";
    SolutionIntent["DEBUGGING"] = "DEBUGGING";
    SolutionIntent["IRRELEVANT"] = "IRRELEVANT";
})(SolutionIntent || (SolutionIntent = {}));
export var SolutionPermissionMode;
(function (SolutionPermissionMode) {
    SolutionPermissionMode["DENY_FULL_SOLUTION"] = "DENY_FULL_SOLUTION";
    SolutionPermissionMode["ALLOW_FULL_SOLUTION"] = "ALLOW_FULL_SOLUTION";
    SolutionPermissionMode["HINTS_ONLY"] = "HINTS_ONLY";
})(SolutionPermissionMode || (SolutionPermissionMode = {}));
export var RefusalLevel;
(function (RefusalLevel) {
    RefusalLevel[RefusalLevel["SOFT"] = 1] = "SOFT";
    RefusalLevel[RefusalLevel["FIRM"] = 2] = "FIRM";
    RefusalLevel[RefusalLevel["STRICT"] = 3] = "STRICT";
})(RefusalLevel || (RefusalLevel = {}));
export var HintLevel;
(function (HintLevel) {
    HintLevel[HintLevel["NONE"] = 0] = "NONE";
    HintLevel[HintLevel["CONCEPT"] = 1] = "CONCEPT";
    HintLevel[HintLevel["DATA_STRUCTURE"] = 2] = "DATA_STRUCTURE";
    HintLevel[HintLevel["EDGE_CASES"] = 3] = "EDGE_CASES";
})(HintLevel || (HintLevel = {}));
export var EditorialAccessTier;
(function (EditorialAccessTier) {
    EditorialAccessTier[EditorialAccessTier["NONE"] = 0] = "NONE";
    EditorialAccessTier[EditorialAccessTier["HINTS_ONLY"] = 1] = "HINTS_ONLY";
    EditorialAccessTier[EditorialAccessTier["FULL"] = 2] = "FULL";
})(EditorialAccessTier || (EditorialAccessTier = {}));
