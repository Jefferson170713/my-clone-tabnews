import retry from "async-retry";

async function waitForAllServices() {
  await awaitForWebServer();

  async function awaitForWebServer() {
    return retry(fetchStatusPage, {
      retries: 100,
      minTimeout: 1000,
      maxTimeout: 1000,
    });

    async function fetchStatusPage(bail, tryNumber) {
      // console.log(tryNumber);
      const response = await fetch("http://localhost:3000/api/v1/status");
      
      if(response.status !== 200) {
        throw Error(`Status page returned ${response.status}`);
      }
    }
  }
}

export default {
  waitForAllServices,
};
