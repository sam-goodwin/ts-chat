1. `setup` should preserve comments in `tsconfig.json` and not fail to parse them
2. document how to configure this plugin with other tools like NextJS
3. document how to use in test libraries like Jest
4. remove dependency on axios (ew, wtf)
5. de-dupe redundant types into a $ref (first, need to check if OpenAI actually supports this)
6. support non-compile time schemas (zod, arktype, etc.)
7. consider implementing stop-logic in the chat function - i.e. does returning undefined stop execution or do we need a special DSL value system?
