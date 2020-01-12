import { act } from 'react-dom/test-utils';
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import { Scheduler } from 'react'
import Resource from './Resource';


const SuspenseMock = ({ onThrow, children }) => {
  class ErrorBoundary extends React.Component {
    componentDidCatch(err) {
      onThrow(err);
    }
    render() {
      return this.props.children
    }
  };

  return <ErrorBoundary>
    {children}
  </ErrorBoundary>
}

let container;
let resource;
let createPromise = val => new Promise((res, rej) => {
  setTimeout(() => {
    res(val)
  }, 1000)
})

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  resource = new Resource(createPromise('resolved value'));

});
afterEach(() => {
  document.body.removeChild(container);
  container = null;
  resource = null;
});

describe("In only render context", () => {
  it("should suspend when rendering", () => {
    let thrownValue;
    let App = () => <div>
      <SuspenseMock onThrow={thrown => thrownValue = thrown}>
        {resource}
      </SuspenseMock>
    </div>;

    act(() => {
      ReactDOM.createRoot(<App />, container)
    })
    expect(thrownValue).toEqual(resource);
    // TODO: test render after resolve
  });



//['getPrototypeOf', 'setPrototypeOf', 'isExtensible', 'preventExtension', 'getOwnPropertyDescriptor', 'defineProperty', 'has','deleteProperty', 'ownKeys', 'construct']
const ProhibitedObjectOperationsError = "Prohibited Operation Error: prohibited Object operation on resource"  
test.each`type                        | operation                                                 | errorOutsideRender
            invocation                | ${() => resource()}                                       | ${"Prohibited Operation Error: invocation of resrouce outside of render"}
            setter                    | ${() => resource.foo = 1}                                 | ${"Prohibited Operation Error: setting of resource property outside of render"}     
            getter                    | ${() => resource.foo}                                     | ${"Prohibited Operation Error: access of resrouce property outside of render"}
            numeric coercion          | ${() => resource + 1}                                     | ${"Prohibited Operation Error: numeric coercion of resource outside of render"}
            string coercion           | ${() =>  resource + ""}                                   | ${"Prohibited Operation Error: string coercion of resource outside or render"}
            boolean coercion          | ${() => resource + true}                                  | ${"Prohibited Operation Error: boolean coercion of resource outside of render"}
            getPrototypeOf            | ${Object.getPrototypeOf}                                  | ${ProhibitedObjectOperationsError}
            setPrototypeOf            | ${() => Object.setPrototypeOf(resource, {})}              | ${ProhibitedObjectOperationsError}
            isExtensible              | ${Object.isExtensible}                                    | ${ProhibitedObjectOperationsError}
            preventExtensions         | ${Object.preventExtensions}                               | ${ProhibitedObjectOperationsError}
            getOwnPropertyDescriptors | ${Object.getOwnPropertyDescriptors}                       | ${ProhibitedObjectOperationsError}
            getOwnPropertyDescriptor  | ${Object.getOwnPropertyDescriptor}                        | ${ProhibitedObjectOperationsError}
            defineProperty            | ${() => Object.defineProperty(resource, { foo: 'bar'})}   | ${ProhibitedObjectOperationsError}
            has                       | ${() => 'foo' in resource}                                | ${ProhibitedObjectOperationsError}
            deleteProperty            | ${() => delete resource.foo}                              | ${ProhibitedObjectOperationsError}
            getOwnPropertyNames       | ${Object.getOwnPropertyNames}                             | ${ProhibitedObjectOperationsError}
            getOwnPropertySymbols     | ${Object.getOwnPropertySymbols}                           | ${ProhibitedObjectOperationsError}
            constructor               | ${() => new resource}                                     | ${ProhibitedObjectOperationsError}
            stringification           | ${() => JSON.stringify(resource)}                         | ${"Prohibited Operation Error: JSON stringification of resource outside of render"}
            parsification             | ${() => JSON.parse(resource)}                             | ${"Prohibited Operation Error: JSON parse of resource outside of render"}

  `
  (({operation, error}) => {
    let thrownValue;
    const operation = () => resource.foo = 1;

    expect(operation).toThrowError(new Error(error));
    act(() => {
      ReactDOM.createRoot(<SuspenseMock onThrow={thrown => thrownValue = thrown}><Operation operation={operation} /></SuspenseMock>, container)
    })
    expect(thrownValue).toEqual(resource);
        // TODO: test render after resolve
  })
})

const Operation = ({operation}) => {
  operation();
  return <div></div>
}
const 
// In render context

// Throws when rendering
// Throws on following operations
  // valueOf
  // toString
  // toPrimitive
  // invocation
  // all Proxy handlers
  // Json stringify
// Perhaps add an inspect handler for debugging
// Store operations done on primitive and apply lazily
// suspends rendering until promise is resolved and resumes with resolved value


// Outside render context

// should return proxy object on access