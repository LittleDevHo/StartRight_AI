import React, { useEffect, useRef } from "react";
import { type NextPage } from "next";
import DefaultLayout from "../layout/default";
import ChatWindow from "../components/ChatWindow";
import Input from "../components/Input";
import Button from "../components/Button";
import { VscLoading } from "react-icons/vsc";
import AutonomousAgent from "../components/AutonomousAgent";
import Expand from "../components/motions/expand";
import { TaskWindow } from "../components/TaskWindow";
import { useAuth } from "../hooks/useAuth";
import type { Message } from "../types/agentTypes";
import { isEmptyOrBlank } from "../utils/whitespace";
import { useSettings } from "../hooks/useSettings";

const Home: NextPage = () => {
  const { session, status } = useAuth();
  const [goalInput, setGoalInput] = React.useState<string>("");
  const [agent, setAgent] = React.useState<AutonomousAgent | null>(null);
  const { settings, saveSettings } = useSettings();
  const [shouldAgentStop, setShouldAgentStop] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [hasSaved, setHasSaved] = React.useState(false);

  useEffect(() => {
    const key = "agentgpt-modal-opened-new";
    localStorage.setItem(key, JSON.stringify(true));
  }, []);

  const nameInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    nameInputRef?.current?.focus();
  }, []);

  useEffect(() => {
    if (agent == null) {
      setShouldAgentStop(false);
    }
  }, [agent]);

  const handleAddMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  const tasks = messages.filter((message) => message.type === "task");

  const disableDeployAgent =
    agent != null || isEmptyOrBlank(goalInput);

  const handleNewGoal = () => {
    const agent = new AutonomousAgent(
      "startright-agent",
      goalInput.trim(),
      handleAddMessage,
      () => setAgent(null),
      settings,
      session ?? undefined
    );
    setAgent(agent);
    setHasSaved(false);
    setMessages([]);
    agent.run().then(console.log).catch(console.error);
  };

  const handleKeyPress = (
    e:
      | React.KeyboardEvent<HTMLInputElement>
      | React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter" && !disableDeployAgent) {
      if (!e.shiftKey) {
        // Only Enter is pressed, execute the function
        handleNewGoal();
      }
    }
  };

  const handleStopAgent = () => {
    setShouldAgentStop(true);
    agent?.stopAgent();
  };

  const proTitle = (
    <>
      AgentGPT<span className="ml-1 text-amber-500/90">Pro</span>
    </>
  );

  const shouldShowSave =
    status === "authenticated" &&
    !agent?.isRunning &&
    messages.length &&
    !hasSaved;

  return (
    <DefaultLayout>
      <main className="flex min-h-screen flex-row">
        <div
          id="content"
          className="z-10 flex min-h-screen w-full items-center justify-center p-2 px-2 sm:px-4 md:px-10"
        >
          <div
            id="layout"
            className="flex h-full w-full max-w-screen-lg flex-col items-center justify-between gap-3 py-5 md:justify-center"
          >
            <div
              id="title"
              className="relative flex flex-col items-center font-mono"
            >
              <div className="flex flex-row items-start shadow-2xl">
                <span className="text-4xl font-bold text-[#C0C0C0] xs:text-5xl sm:text-6xl">
                  Start
                </span>
                <span className="text-4xl font-bold text-white xs:text-5xl sm:text-6xl">
                  Right
                </span>
              </div>
            </div>

            <Expand className="flex w-full flex-row">
              <ChatWindow
                className="sm:mt-4"
                messages={messages}
                title={session?.user.subscriptionId ? proTitle : "GPT"}
                showDonation={
                  status != "loading" && !session?.user.subscriptionId
                }
                scrollToBottom
              />
              {tasks.length > 0 && <TaskWindow tasks={tasks} />}
            </Expand>

            <div className="flex w-full flex-col gap-2 sm:mt-4 md:mt-10">
              <Expand delay={1.2}>
                <Input
                  left={
                    <>
                      <span className="ml-2">Input:</span>
                    </>
                  }
                  disabled={agent != null}
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  onKeyDown={(e) => handleKeyPress(e)}
                  placeholder="example > a marketplace for clothes"
                  type="textarea"
                />
              </Expand>
            </div>

            <Expand delay={1.3} className="flex gap-2">
              <Button
                disabled={disableDeployAgent}
                onClick={handleNewGoal}
                className="sm:mt-10"
              >
                {agent == null ? (
                  "Start Agent"
                ) : (
                  <>
                    <VscLoading className="animate-spin" size={20} />
                    <span className="ml-2">Running</span>
                  </>
                )}
              </Button>
              <Button
                disabled={agent == null}
                onClick={handleStopAgent}
                className="sm:mt-10"
                enabledClassName={"bg-red-600 hover:bg-red-400"}
              >
                {shouldAgentStop ? (
                  <>
                    <VscLoading className="animate-spin" size={20} />
                    <span className="ml-2">Stopping</span>
                  </>
                ) : (
                  <span>Stop Agent</span>
                )}
              </Button>
            </Expand>
          </div>
        </div>
      </main>
    </DefaultLayout>
  );
};

export default Home;
