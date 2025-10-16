import "./globals.css";
import { ReactNode } from "react";
import { CopilotKit } from "@copilotkit/react-core"; 
import "@copilotkit/react-ui/styles.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body> 
        {/* Use the public api key you got from Copilot Cloud  */}
        <CopilotKit 
          runtimeUrl="/api/copilotkit"
          agent="agent" // the name of the agent you want to use
        > 
          {children}
        </CopilotKit>
      </body>
    </html>
  );
}