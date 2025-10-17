<Paper>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                All Questionnaire Responses
              </Typography>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Hospital ID</TableCell>
                      <TableCell>Patient Name</TableCell>
                      <TableCell>Patient Email</TableCell>
                      <TableCell>ISS Score</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {responses
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((response) => (
                        <TableRow key={response.id}>
                          <TableCell>{response.response_data.hospital_id}</TableCell>
                          <TableCell>{response.response_data.name || 'N/A'}</TableCell>
                          <TableCell>{response.response_data.email || '-'}</TableCell>
                          <TableCell>{getScoreFromResponse(response.response_data)}</TableCell>
                          <TableCell>{formatDate(response.created_at)}</TableCell>
                          <TableCell align="center">
                            <Tooltip title=" Edit/View Response ">
                              <IconButton size="small">
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={responses.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </Box>
          </Paper>