import { NotificationProvider } from "./notification";

export default function Providers({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <NotificationProvider>{children}</NotificationProvider>;
}
