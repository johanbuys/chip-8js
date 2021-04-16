fetch('./roms/ibm.c8')
  .then(
    function (response) {
      if (response.status !== 200) {
        console.log('Looks like there was a problem. Status Code: ' +
          response.status);
        return;
      }

      // Examine the text in the response
      response.arrayBuffer().then(function (data) {
        console.log(data);
      });
    }
  )
  .catch(function (err) {
    console.log('Fetch Error :-S', err);
  });