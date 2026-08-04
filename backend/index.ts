import "dotenv/config";
import app from "./app";
import { connectDB } from "./db";

const PORT = process.env.PORT || 8000;

(async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log("the port is listening on port " + PORT);
    console.log("current environment is: " + process.env.NODE_ENV);
  });
})();
