import { transformNodes, interleaveTemplateLiteral } from "./internal";

import { useSchema } from "../modules";

import { useCollect, useViewModel } from "./external";
import { View } from "./types";

export const view = function (
  strings: TemplateStringsArray,
  ...args: any[]
): View {
  // Create a private schema. Defines relationship between our data and view
  const schema = useSchema();

  // Assemble strings and ids together as a new string. Store argument in schema
  const interleaved = interleaveTemplateLiteral(strings, args, schema);

  // Create a template that allows us to assemble content and query for elements
  const template = document.createElement("template");
  template.innerHTML = interleaved;

  // Before returning the view, transform any ids to their intended value
  const view = transformNodes(schema, template.content);

  view.collect = useCollect(view);
  view.viewModel = useViewModel(schema);

  return view;
};
