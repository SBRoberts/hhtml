/* eslint-disable prefer-rest-params */
import { useSchema, Schema } from "../modules";
import { View } from "../safe";

export const handleSetProp = (prop, value) => {
  // Return undefined if the prop isn't defined.
  if (!prop) return true;

  prop.update(value);

  return prop;
};

/**
 * @description A View Model is a collection of data that is used within your view. When you update this data,
 * your view will also update. If you are reusing properties within your view, it is important to prefix your properties with **`$`**.
 * Otherwise, you can get and set properties in your object like you would normally
 * * Ex: `<span style="color: ${data.$myColour}">${data.$myColour}</span>`
 * @param model the object whose data will populate the view. Updating this model will also update the view.
 */
export const useViewModel = function (
  model: Record<string | number> | any[]
): Proxy {
  const schema: Schema = useSchema();

  model = Array.isArray(model) ? Array.from(model) : Object.assign({}, model);

  // Define proxy intercept methods
  const traps: ProxyHandler = {
    get(model, key) {
      // If the key is prefixed with a `$`, we are building the view and should always return the prop object, if possible
      const isContructing = key[0] === "$";
      key = isContructing ? key.replace("$", "") : key;

      // If prop doesn't exist return undefined
      if (!(key in model)) return;

      // Maintain use of static methods, like array.map
      if (key in model.__proto__) {
        return Reflect.get(model, key);
      }

      let prop = model[key];

      const isSchemaProp =
        typeof prop === "object" && "id" in prop && schema.hasId(prop.id);

      // If the prop is an object and not a schema property, we want to proxify it
      if (!isSchemaProp && typeof prop === "object" && !Array.isArray(prop)) {
        const proxified = new Proxy(prop, this);
        model[key] = proxified;
        return proxified;
      }

      // If the property is a schema property but we're not in construciton mode, return the value
      if (isSchemaProp && !isContructing) {
        return Reflect.get(prop, "value");
      }

      // Our property exists in our model, but not in our schema. Let's define and return it
      const schemaProp = schema.defineProperty(prop, key);
      model[key] = schemaProp;
      return isContructing ? schemaProp : prop;
    },
    set(model, key, value) {
      const prop = schema.getPropertyByKey(key);
      return handleSetProp(prop, value);
    },
  };

  const proxy = new Proxy(model, traps);
  return proxy;
};
