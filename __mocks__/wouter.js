// Mock for wouter router
module.exports = {
  Link: ({ children, href, ...props }) => {
    const React = require("react");
    return React.createElement("a", { href, ...props }, children);
  },
  useLocation: () => ["/", () => {}],
  useRoute: () => [false, {}],
  Router: ({ children }) => {
    const React = require("react");
    return React.createElement("div", null, children);
  },
  Route: ({ _path, component: Component, children, ...props }) => {
    const React = require("react");
    return React.createElement("div", props, Component ? React.createElement(Component) : children);
  },
};
