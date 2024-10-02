import { FunctionComponent } from "react";

import { PpDisplay, PpString } from "pp-display";
import classes from "./PpString.module.css";

type HypothesisProps = {
  content: PpString;
};

const hypothesis: FunctionComponent<HypothesisProps> = (props) => {
  const { content } = props;

  return (
    <div className={classes.Hypothesis}>
      <PpDisplay pp={content} coqCss={classes} />
    </div>
  );
};

export default hypothesis;
