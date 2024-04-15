import Autocomplete from "@mui/material/Autocomplete";
import { debounce } from "@mui/material/utils";
import { useEffect, useMemo, useState } from "react";

import { searchEntities, SearchEntitiesParams, EntityType } from "src/wikibase";
import { Popper, SxProps, TextField, Typography } from "@mui/material";

export interface ItemValue {
  id: string;
  label?: string;
  special?: boolean;
}

export default function ItemSearch(props: {
  type: EntityType;
  value?: ItemValue | string | null;
  onChange?: (value: ItemValue | null) => void;
  sx?: SxProps;
  popperWidth?: (width: number) => number;
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
    <Autocomplete<ItemValue, false, boolean>
      sx={props.sx}
      onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
      options={options}
      getOptionLabel={(option) => {
        return option.id;
      }}
      isOptionEqualToValue={(option, value) => value && option.id === value.id}
      filterOptions={(opt) => opt}
      PopperComponent={(popperProps) => {
        const popperStyle = { ...popperProps.style };
        if (props.popperWidth && popperStyle.width) {
          popperStyle.width = props.popperWidth(+popperStyle.width);
        }

        return (
          <Popper
            {...popperProps}
            placement="bottom-start"
            style={popperStyle}
          />
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={props.type[0].toUpperCase() + props.type.slice(1) + " ID"}
        />
      )}
      renderOption={(props, option) => (
        <li {...props}>
          <Typography
            sx={{
              fontWeight: "bold",
              marginRight: "1em",
            }}
          >
            {option.id}
          </Typography>
          {option.label && <Typography>{option.label}</Typography>}
        </li>
      )}
      value={
        typeof props.value === "string" ? { id: props.value } : props.value
      }
      onChange={(_, value) => {
        props.onChange?.(value);
      }}
    />
  );
}
