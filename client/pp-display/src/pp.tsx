import { ResizeObserverEntry } from "@juggle/resize-observer";
import useResizeObserver from "@react-hook/resize-observer";
import { FunctionComponent, useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";

import PpBox from "./pp-box";
import {
  Box,
  BoxDisplay,
  Break,
  BreakInfo,
  DisplayType,
  HideStates,
  PpMode,
  PpString,
  Term,
  Token,
  TokenType,
} from "./types";

import classes from "./Pp.module.css";

type PpProps = {
  pp: PpString;
  coqCss: CSSModuleClasses;
  maxDepth: number;
};

type DisplayState = {
  breakIds: BreakInfo[];
  display: Box | null;
  tokenStream: Token[] | null;
  context: CanvasRenderingContext2D | null;
};

const getPpTag = (
  pp: PpString,
  tag: string,
  indent: number,
  mode: PpMode,
  coqCss: CSSModuleClasses,
): Box | Term | null => {
  const id = uuid();
  switch (pp[0]) {
    case "Ppcmd_empty":
      console.error("Received PpTag with empty");
      return null;
    case "Ppcmd_elided":
      console.error("Received PpTag with elided");
      return null;
    case "Ppcmd_string":
      return {
        type: DisplayType.term,
        classList: [classes.Tag, tag],
        content: pp[1],
      } as Term;
    case "Ppcmd_glue":
      return {
        id: "box-" + id,
        type: DisplayType.box,
        mode: mode,
        classList: [tag],
        indent: indent,
      } as Box;
    case "Ppcmd_force_newline":
      console.error("Received PpTag with fnl");
      return null;
    case "Ppcmd_comment":
      console.error("Received PpTag with comment");
      return null;
    case "Ppcmd_box":
      const m = pp[1][0];
      const i = m !== PpMode.horizontal ? pp[1][1] : 0;
      return {
        id: "box-" + id,
        type: DisplayType.box,
        mode: mode,
        classList: [tag],
        indent: indent,
        boxChildren: getBoxChildren(pp[2], m, i, id, coqCss),
      } as Box;
    case "Ppcmd_tag":
      console.error("Received PpTag with tag");
      return null;
    case "Ppcmd_print_break":
      console.error("Received PpTag with br");
      return null;
  }
};

const flattenGlue = (
  glue: PpString[],
  mode: PpMode,
  indent: number,
  boxId: string,
  coqCss: CSSModuleClasses,
): BoxDisplay[] => {
  const g: BoxDisplay[][] = glue.map((pp) => {
    switch (pp[0]) {
      case "Ppcmd_empty":
        return [];
      case "Ppcmd_elided":
        return [
          {
            type: DisplayType.term,
            classList: [classes.Text],
            content: "[...]",
          } as Term,
        ];
      case "Ppcmd_string":
        return [
          {
            type: DisplayType.term,
            classList: [classes.Text],
            content: pp[1],
          } as Term,
        ];
      case "Ppcmd_glue":
        return flattenGlue(pp[1], mode, indent, boxId, coqCss);
      case "Ppcmd_force_newline":
        return [
          {
            id: "fnl",
            type: DisplayType.break,
            offset: 0,
            mode: mode,
            horizontalIndent: 0,
            indent: indent,
            shouldBreak: true,
          } as Break,
        ];
      case "Ppcmd_comment":
        return [];
      case "Ppcmd_box":
        return [boxifyPpString(pp, coqCss)];
      case "Ppcmd_tag":
        return [
          getPpTag(
            pp[2],
            coqCss[pp[1].replaceAll(".", "-")],
            indent,
            mode,
            coqCss,
          ),
        ];
      case "Ppcmd_print_break":
        const brId = uuid();
        return [
          {
            id: "box-" + boxId + "break-" + brId,
            type: DisplayType.break,
            offset: 0,
            mode: mode,
            horizontalIndent: pp[1],
            indent: pp[2],
            shouldBreak: false,
          } as Break,
        ];
    }
  });
  const r = g.reduce((acc, cur) => acc.concat(cur), []);

  return r;
};

const getBoxChildren = (
  pp: PpString,
  mode: PpMode,
  indent: number,
  boxId: string,
  coqCss: CSSModuleClasses,
): BoxDisplay[] => {
  switch (pp[0]) {
    case "Ppcmd_empty":
      return [];
    case "Ppcmd_elided":
      return [
        {
          type: DisplayType.term,
          classList: [classes.Text],
          content: "[...]",
        } as Term,
      ];
    case "Ppcmd_glue":
      return flattenGlue(pp[1], mode, indent, boxId, coqCss);
    case "Ppcmd_string":
      return [
        {
          type: DisplayType.term,
          classList: [classes.Text],
          content: pp[1],
        } as Term,
      ];
    case "Ppcmd_force_newline":
      return [];
    case "Ppcmd_comment":
      return [];
    case "Ppcmd_box":
      return [boxifyPpString(pp, coqCss)];
    case "Ppcmd_tag":
      return [
        getPpTag(
          pp[2],
          coqCss[pp[1].replaceAll(".", "-")],
          indent,
          mode,
          coqCss,
        ),
      ];
    case "Ppcmd_print_break":
      return [];
  }
};

const boxifyPpString = (pp: PpString, coqCss: CSSModuleClasses): Box => {
  const id = uuid();
  switch (pp[0]) {
    case "Ppcmd_empty":
    case "Ppcmd_string":
    case "Ppcmd_glue":
    case "Ppcmd_force_newline":
    case "Ppcmd_comment":
    case "Ppcmd_tag":
    case "Ppcmd_print_break":
      console.log("Goal contains non-boxed PpString");
      return {
        id: "box-" + id,
        type: DisplayType.box,
        classList: [],
        mode: PpMode.hovBox,
        indent: 0,
        boxChildren: getBoxChildren(pp, PpMode.hovBox, 0, id, coqCss),
      } as Box;
    case "Ppcmd_elided":
      return {
        id: "box-" + id,
        type: DisplayType.box,
        classList: [classes.Elided],
        indent: 0,
        boxChildren: [
          {
            type: DisplayType.term,
            classList: [classes.Text],
            content: "[...]",
          } as Term,
        ],
      } as Box;
    case "Ppcmd_box":
      const mode = pp[1][0];
      const indent = mode !== PpMode.horizontal ? pp[1][1] : 0;
      return {
        id: "box-" + id,
        type: DisplayType.box,
        mode: mode,
        classList: [],
        indent: indent,
        boxChildren: getBoxChildren(pp[2], mode, indent, id, coqCss),
      } as Box;
  }
};

//create a canvas and get its context to compute character width
const getContext = () => {
  const fragment = document.createDocumentFragment();
  const canvas = document.createElement("canvas");
  fragment.appendChild(canvas);
  return canvas.getContext("2d");
};

const ppDisplay: FunctionComponent<PpProps> = (props) => {
  const { pp, coqCss, maxDepth } = props;
  const inputBox = boxifyPpString(pp, coqCss);
  // console.log("box depth", max_box_depth(inputBox));
  const [displayBox, setDisplayBox] = useState<Box>(inputBox);
  const [breakIds, setBreakIds] = useState<BreakInfo[]>([]);
  const [tokenStream, setTokenStream] = useState<Token[]>([]);
  // const [displayState, setDisplayState] = useState<DisplayState>({
  //   breakIds: [],
  //   display: null,
  //   tokenStream: null,
  //   context: null,
  // });
  useEffect(() => {
    console.time("initializeDisplay");
    setDisplayBox(inputBox);
    console.timeLog("initializeDisplay");
    const context = getContext();
    if (!context) {
      console.error("Could not get canvas context");
      return;
    }
    // setTokenStream(buildTokenStream(inputBox, context));
    console.timeLog("initializeDisplay");
    computeNeededBreaks();
    console.timeEnd("initializeDisplay");
  }, [pp]);

  const [lastEntry, setLastEntry] = useState<ResizeObserverEntry | null>(null);

  const container = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLSpanElement>(null);

  const computeNeededBreaks = () => {
    if (container.current) {
      const containerRect = container.current.getBoundingClientRect();
      const context = getContext();
      if (!context) {
        console.error("Could not get canvas context");
        return;
      }
      setBreakIds(scanTokenStream(tokenStream, containerRect.width, context));
    }
  };

  useResizeObserver(container, (entry) => {
    if (container.current && content.current) {
      //in this case the window has already been resized
      if (lastEntry) {
        //don't trigger a recomputation for small resizes
        if (
          Math.abs(entry.contentRect.width - lastEntry.contentRect.width) <= 10
        ) {
          return;
        }
      }
      // Otherwise, recompute the needed breaks
      computeNeededBreaks();
    }

    setLastEntry(entry);
  });

  // useEffect(() => {
  //   initializeDisplay(pp);
  // }, [pp]);

  // useLayoutEffect(() => {
  //   if (!alreadyComputed.current) {
  //     alreadyComputed.current = true;
  //     console.time("computeNeededBreaks");
  //     computeNeededBreaks();
  //     console.timeEnd("computeNeededBreaks");
  //   }
  // }, [displayState]);

  // const initializeDisplay = (pp: PpString) => {
  //   if (content.current) {
  //     console.time("initializeDisplay");
  //     const context = getContext();
  //     console.timeLog("initializeDisplay");
  //     context!.font = getComputedStyle(content.current).font || "monospace";
  //     console.timeLog("initializeDisplay");
  //     const display = boxifyPpString(pp);
  //     console.timeLog("initializeDisplay");
  //     const tokenStream = buildTokenStream(display, context!);
  //     alreadyComputed.current = false;
  //     console.timeLog("initializeDisplay");
  //     setDisplayState({
  //       breakIds: [],
  //       display: display,
  //       tokenStream: tokenStream,
  //       context: context,
  //     });
  //     console.timeEnd("initializeDisplay");
  //   }
  // };

  const estimateBoxWidth = (
    box: Box,
    context: CanvasRenderingContext2D,
  ): number => {
    let currentWidth = 0;
    for (let childBox of box.boxChildren) {
      if (childBox) {
        switch (childBox.type) {
          case DisplayType.box:
            currentWidth += estimateBoxWidth(childBox, context);
            break;
          case DisplayType.break:
            break;
          case DisplayType.term:
            currentWidth += context.measureText(childBox.content).width;
            break;
        }
      }
    }
    return currentWidth;
  };

  const scanTokenStream = (
    tokenStream: Token[],
    containerWidth: number,
    context: CanvasRenderingContext2D,
  ): BreakInfo[] => {
    let currentLineWidth = 0;
    let breakAll: boolean[] = [];
    let breaks: BreakInfo[] = [];
    let currentOffset: number[] = [0];
    for (let token of tokenStream) {
      switch (token.type) {
        case TokenType.term:
          currentLineWidth += token.length;
          break;
        case TokenType.open:
          if (
            (token.mode === PpMode.hvBox &&
              currentLineWidth + token.length > containerWidth) ||
            token.mode === PpMode.vertical
          ) {
            breakAll.push(true);
          } else {
            breakAll.push(false);
          }
          currentOffset.push(token.offset + currentLineWidth);
          break;
        case TokenType.close:
          if (breakAll.length > 0) {
            breakAll.pop();
          }
          currentOffset.pop();
          break;
        case TokenType.break:
          if (
            currentLineWidth + token.length > containerWidth ||
            breakAll[breakAll.length - 1]
          ) {
            const offset = currentOffset[currentOffset.length - 1];
            breaks.push({
              id: token.id,
              offset: offset + token.indent,
            });
            currentLineWidth = offset + token.indent;
            break;
          }
          currentLineWidth += context.measureText(" ").width;
          break;
      }
    }
    return breaks;
  };

  // build a token stream generator from a Box and CanvasRenderingContext2D
  // const buildTokenStream = (box: Box, context: CanvasRenderingContext2D) : Generator<Token[]> => {

  const buildTokenStream = (
    box: Box,
    context: CanvasRenderingContext2D,
  ): Token[] => {
    let tokenStream: Token[] = [];
    for (let i = 0; i < box.boxChildren.length; i++) {
      let childBox = box.boxChildren[i];
      if (childBox) {
        switch (childBox.type) {
          case DisplayType.box:
            const blockWidth = estimateBoxWidth(childBox, context);
            const blockTokenStream = buildTokenStream(childBox, context);
            const offset = context.measureText(
              " ".repeat(childBox.indent),
            ).width;
            tokenStream = tokenStream
              .concat([
                {
                  type: TokenType.open,
                  length: blockWidth,
                  mode: childBox.mode,
                  offset: offset,
                },
              ])
              .concat(blockTokenStream)
              .concat([{ type: TokenType.close }]);
            break;
          case DisplayType.break:
            let blockLength = 0;
            for (let j = i + 1; j < box.boxChildren.length; j++) {
              let nextBlock = box.boxChildren[j];
              if (nextBlock) {
                switch (nextBlock.type) {
                  case DisplayType.box:
                    blockLength += estimateBoxWidth(nextBlock, context);
                    break;
                  case DisplayType.break:
                    break;
                  case DisplayType.term:
                    blockLength += context.measureText(nextBlock.content).width;
                }
                if (nextBlock.type === DisplayType.break) {
                  break;
                }
              }
            }
            const indent = context.measureText(" ").width * childBox.indent;
            tokenStream = tokenStream.concat([
              {
                type: TokenType.break,
                id: childBox.id,
                length: blockLength,
                indent: indent,
              },
            ]);
            break;
          case DisplayType.term:
            tokenStream = tokenStream.concat({
              type: TokenType.term,
              length: context.measureText(childBox.content).width,
            });
            break;
        }
      }
    }
    return tokenStream;
  };

  const PpBox_from_Box = (
    box: Box,
    breaks: BreakInfo[],
    parentHide: HideStates,
  ): JSX.Element => {
    return (
      <PpBox
        key={`box-${box.id}`}
        id={box.id}
        coqCss={coqCss}
        classList={box.classList}
        mode={box.mode}
        type={box.type}
        boxChildren={box.boxChildren}
        indent={box.indent}
        breaks={breaks}
        parentHide={parentHide}
      />
    );
  };

  return (
    <div ref={container} className={classes.Container}>
      <span ref={content} className={classes.Content}>
        {PpBox_from_Box(displayBox, breakIds, HideStates.UNHIDE)}
        {/* <PpBox
          id={displayBox.id}
          coqCss={coqCss}
          depth={0}
          parentHide={HideStates.UNHIDE}
          hovered={hovered}
          maxDepth={maxDepth}
          classList={[]}
          mode={displayBox.mode}
          type={displayBox.type}
          boxChildren={displayBox.boxChildren}
          indent={displayBox.indent}
          breaks={breakIds}
          addedDepth={0}
        /> */}
      </span>
    </div>
  );
};

export default ppDisplay;
