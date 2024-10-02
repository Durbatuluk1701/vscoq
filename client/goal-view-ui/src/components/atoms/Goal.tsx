import { FunctionComponent } from "react";

import { PpDisplay, PpString } from "pp-display";
import classes from "./PpString.module.css";

type GoalProps = {
  goal: PpString;
  setHelpMessage: (message: string) => void;
};

const goal: FunctionComponent<GoalProps> = (props) => {
  const { goal, setHelpMessage } = props;

  return (
    <div
      className={classes.Goal}
      onMouseOver={() => {
        if (setHelpMessage !== undefined) {
          setHelpMessage(
            "Click on the window and keep Alt pressed in to enable term eliding/expanding.",
          );
        }
      }}
      onMouseOut={() => {
        if (setHelpMessage !== undefined) {
          setHelpMessage("");
        }
      }}
    >
      <PpDisplay pp={goal} coqCss={classes} />
    </div>
  );
};

export default goal;
