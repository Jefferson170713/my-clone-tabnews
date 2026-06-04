function status(request, response) {
  response.status(200).json({
    "teste de api funcionando": "ok",
  });
}
export default status;
