import { Hono } from "hono";
import { validateWord } from "../dictionary/words";

const dictionaryRoutes = new Hono();

dictionaryRoutes.get("/check/:word", (c) => {
  const word = c.req.param("word");
  const result = validateWord(word);

  return c.json({
    word,
    valid: result.valid,
    source: result.source,
  });
});

export default dictionaryRoutes;