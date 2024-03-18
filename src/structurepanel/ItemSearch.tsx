import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";
import { debounce } from "@mui/material/utils";
import { CSSProperties, useEffect, useMemo, useState } from "react";

import { searchEntities, SearchEntitiesParams, EntityType } from "src/wikibase";
import { Popper, SxProps } from "@mui/material";

interface ItemValue {
  id: string;
  [other: string]: any;
}

export default function ItemSearch(props: {
  type: EntityType;
  sx?: SxProps;
  popperStyle?: CSSProperties;
}) {
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState<any[]>([]);

  const fetchOptions = useMemo(
    () =>
      debounce(
        (params: SearchEntitiesParams, callback: (response: any) => void) => {
          searchEntities(params).then(callback);
        }
      ),
    []
  );

  useEffect(() => {
    if (inputValue === "") {
      setOptions([]);
      return undefined;
    }

    let active = true;
    fetchOptions({ search: inputValue, type: props.type }, (results) => {
      if (active) {
        setOptions(results.search);
      }
    });
    return () => {
      active = false;
    };
  }, [inputValue, fetchOptions]);

  return (
    <Autocomplete
      sx={props.sx}
      disableClearable
      onInputChange={(event, newInputValue) => setInputValue(newInputValue)}
      options={options}
      getOptionLabel={(option) => option.id}
      isOptionEqualToValue={(option, value) => value && option.id === value.id}
      filterOptions={(x) => x}
      PopperComponent={(popperProps) => (
        <Popper
          {...popperProps}
          placement="bottom-start"
          style={props.popperStyle}
        />
      )}
      renderInput={(params) => (
        <TextField {...params} label="ID" variant="outlined" size="small" />
      )}
      renderOption={(props, option) => (
        <li {...props}>
          <Grid container>
            <Grid item xs={1} sx={{ fontWeight: "bold" }}>
              {option.id}
            </Grid>
            <Grid item xs>
              {option.label}
            </Grid>
          </Grid>
        </li>
      )}
      onChange={(event, value) => console.log()}
    />
  );
}
