import React from "react";
import { Box, Typography, Chip } from "@mui/material";

const QuestionnaireHeader = ({ title, page, totalPages, isMobile }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
    <Typography
      variant={isMobile ? "h6" : "h5"}
      component="h1"
      color="primary"
      fontWeight={600}
    >
      {title}
    </Typography>
    <Chip
      label={`${page}/${totalPages}`}
      color="primary"
      variant="outlined"
      size={isMobile ? "small" : "medium"}
    />
  </Box>
);

export default QuestionnaireHeader;
