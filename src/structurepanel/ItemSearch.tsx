import Autocomplete from "@mui/material/Autocomplete";
import Grid from "@mui/material/Grid";
import { debounce } from "@mui/material/utils";
import { Ref, forwardRef, useEffect, useMemo, useState } from "react";

import { searchEntities, SearchEntitiesParams, EntityType } from "src/wikibase";
import { Popper, SxProps, TextField } from "@mui/material";

interface ItemValue {
  id: string;
  [other: string]: any;
}

function ItemSearch(
  props: {
    type: EntityType;
    value: ItemValue | null;
    onChange: (value: ItemValue | null) => void;
    label?: string;
    sx?: SxProps;
    popperWidth?: () => number;
  },
  ref?: Ref<unknown>
) {
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
    <Autocomplete<ItemValue, false, boolean>
      sx={props.sx}
      ref={ref}
      disableClearable
      onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
      options={options}
      getOptionLabel={(option) => option.id}
      isOptionEqualToValue={(option, value) => value && option.id === value.id}
      filterOptions={(x) => x}
      PopperComponent={(popperProps) => {
        const popperStyle = { ...popperProps.style };
        if (props.popperWidth) {
          popperStyle.width = props.popperWidth();
        }

        return (
          <Popper
            {...popperProps}
            placement="bottom-start"
            style={popperStyle}
          />
        );
      }}
      renderInput={(params) => <TextField {...params} label={props.label} />}
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
      value={props.value}
      onChange={(_, value) => props.onChange(value)}
    />
  );
}

export default forwardRef(ItemSearch);
