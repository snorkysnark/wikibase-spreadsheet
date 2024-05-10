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
      <RadioGroup
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
          value={state.delimiter}
          onChange={(event) =>
            setState({ delimiter: event.target.value, custom: true })
          }
          sx={{ display: "block" }}
        />
      )}
      <input type="hidden" name="delimiter" value={state.delimiter} />
    </>
  );
}
