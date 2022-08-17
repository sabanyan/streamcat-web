import React from "react"
import { Drawer, Box } from "@mui/material"

type Props = {
    children?: React.ReactNode
};

export const Drawer2 = (props:Props) => {
    const { children } = props;

    return <Drawer  variant="persistent"
                    anchor="right"
                    open={true}
                    sx={{width: '28%',
                        padding:'4%',
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            width: '28%',
                            boxSizing: 'border-box',
                        }
                    }}>
        <Box sx={{padding:'4%'}}>{children}</Box>
    </Drawer>;
};
