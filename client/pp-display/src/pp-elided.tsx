import { FunctionComponent } from "react";
import classes from "./Pp.module.css";

type PpElidedProps = {
  id: string;
};

const ppElided: FunctionComponent<PpElidedProps> = (props) => {
  const { id } = props;

  return (
    <span id={id} className={classes.Ellipsis}>
      [...]
    </span>
  );
};

export default ppElided;
