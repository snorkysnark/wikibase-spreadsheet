import {
  FormControlLabel,
  FormHelperText,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";
import { useState } from "react";

export type DelimiterState =
  | { delimiter: "," | "\t"; custom: false }
  | { delimiter: string; custom: true };

export function useDelimiter() {
  return useState<DelimiterState>({ delimiter: ",", custom: false });
}

export function DelimiterMenu(props: {
  value?: DelimiterState;
  onChange?(value: DelimiterState): void;
}) {
  // Support both controlled and uncontrolled modes
  const [state, setState] =
    props.value !== undefined && props.onChange
      ? [props.value, props.onChange]
      : useState({ delimiter: ",", custom: false });

  return (
    <>
      <FormHelperText>Delimiter</FormHelperText>
      <div css={{ display: "flex" }}>
        <RadioGroup
          sx={{ display: "inline" }}
          row
          value={state.custom ? "other" : state.delimiter}
          onChange={(event) => {
            if (event.target.value === "other") {
              setState({ delimiter: "", custom: true });
            } else {
              setState({
                delimiter: event.target.value as "," | "\t",
                custom: false,
              });
            }
          }}
        >
          <FormControlLabel control={<Radio />} label="Comma" value="," />
          <FormControlLabel control={<Radio />} label="Tab" value={"\t"} />
          <FormControlLabel control={<Radio />} label="Other" value="other" />
        </RadioGroup>
        {state.custom && (
          <TextField
            sx={{ flexGrow: "1", width: "5em" }}
            value={state.delimiter}
            onChange={(event) =>
              setState({ delimiter: event.target.value, custom: true })
            }
          />
        )}
      </div>
      <input type="hidden" name="delimiter" value={state.delimiter} />
    </>
  );
}
