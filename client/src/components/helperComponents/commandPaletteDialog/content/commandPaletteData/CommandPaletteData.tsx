import {
  House,
  ListChecks,
  UserRoundPen,
  KeySquare,
  FilePen,
  LogOut,
  MessagesSquare,
  Bug,
} from "lucide-react";

type NavigationCommand = {
  title: string;
  link: string;
  showLink: string;
  logo: React.ReactNode;
  type: "navigation";
  params?: Record<string, string>;
};

type ActionCommand = {
  title: string;
  action: () => void;
  showLink: string;
  logo: React.ReactNode;
  type: "action";
};

type CommandPaletteDataType = NavigationCommand | ActionCommand;

export const CommandPaletteData: CommandPaletteDataType[] = [
  {
    title: "Home",
    link: "/",
    showLink: "/home",
    logo: <House size={25} />,
    type: "navigation",
  },
  {
    title: "Account",
    link: "/account/[name]",
    showLink: "/account",
    logo: <UserRoundPen size={25} />,
    type: "navigation",
  },
  {
    title: "Problems",
    link: "/problems",
    showLink: "/problems",
    logo: <ListChecks size={25} />,
    type: "navigation",
  },
  {
    title: "Two Sum",
    link: "/problems/problem-detail?title=Two%20Sum",
    showLink: "/problem-detail/TwoSum",
    logo: <Bug size={25} />,
    type: "navigation",
  },
  {
    title: "Interviews",
    link: "/interview",
    showLink: "/interview",
    logo: <MessagesSquare size={25} />,
    type: "navigation",
  },
  {
    title: "Login",
    showLink: "Open Login Dialog",
    logo: <KeySquare size={25} />,
    action: () => {},
    type: "action",
  },
  {
    title: "SignUp",
    showLink: "Open Signup Dialog",
    logo: <FilePen size={25} />,
    action: () => {},
    type: "action",
  },
  {
    title: "Logout",
    showLink: "Sign out of account",
    logo: <LogOut size={25} />,
    action: () => {},
    type: "action",
  },
];
