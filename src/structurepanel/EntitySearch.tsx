import Autocomplete from "@mui/material/Autocomplete";
import { useState } from "react";
import { Settings as IconGear } from "@mui/icons-material";

import { searchEntities, SearchEntitiesParams, EntityType } from "src/wikibase";
import { Popper, SxProps, TextField, Typography } from "@mui/material";
import { useAsync, useDebouncedEffect } from "@react-hookz/web";

export interface HasId {
  id: string;
  label?: string;
}

export interface EntityValue {
  isSpecial: boolean;
  data: HasId;
}

function withSpecialTag(isSpecial: boolean, options: HasId[] | undefined) {
  return options ? options.map((data) => ({ isSpecial, data })) : [];
}

export function EntitySearch(props: {
  type: EntityType;
  value?: EntityValue | string | null;
  extraOptions?: HasId[];
  onChange?: (value: EntityValue | null) => void;
  sx?: SxProps;
  popperWidth?: (width: number) => number;
}) {
  const [inputValue, setInputValue] = useState("");
  const [{ result: entityOptions }, fetchOptions] = useAsync(
    async (props: SearchEntitiesParams) => (await searchEntities(props)).search
  );

  useDebouncedEffect(
    () => fetchOptions.execute({ search: inputValue, type: props.type }),
    [inputValue, props.type],
    200
  );

  return (
    <Autocomplete<EntityValue, false, boolean>
      sx={props.sx}
      onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
      options={[
        ...withSpecialTag(true, props.extraOptions),
        ...withSpecialTag(false, entityOptions),
      ]}
      getOptionLabel={(option) => option.data.id}
      isOptionEqualToValue={(option, value) => option.data.id === value.data.id}
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
          {option.isSpecial && <IconGear />}
          <Typography
            sx={{
              fontWeight: "bold",
              marginRight: "1em",
            }}
          >
            {option.data.id}
          </Typography>
          {option.data.label && <Typography>{option.data.label}</Typography>}
        </li>
      )}
      value={
        typeof props.value === "string"
          ? { isSpecial: false, data: { id: props.value } }
          : props.value
      }
      onChange={(_, value) => {
        props.onChange?.(value);
      }}
    />
  );
}
