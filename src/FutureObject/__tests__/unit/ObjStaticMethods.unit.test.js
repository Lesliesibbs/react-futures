
    jest.mock('scheduler', () => require('scheduler/unstable_mock'));
    jest.useFakeTimers();

import React, { Suspense } from 'react';
import { createFutureObject } from '../../../index';
import {  getterObjectStaticEach, noopObjectStaticEach, mutableObjectStaticEach, invalidObjectStaticEach } from './FutureObj-statics';
import waitForSuspense from '../../../test-utils/waitForSuspense';
import { act } from 'react-dom/test-utils';
import { render } from '../../../test-utils/rtl-renderer';
import { waitFor } from '@testing-library/dom';
import {TransparentObjectEffect, isEffect} from '../../../internal';
import {unwrapProxy, suspend} from '../../../internal';
import {TransparentArrayEffect} from '../../../internal';
expect.extend(require('../../../test-utils/renderer-extended-expect'));	  


// TODO: test error handling
const expectedJSON = value => ({
  foo: "futon",
  bar: "barcandy",
  bazz: "bazzerita",
  value,
});
// TODO: test obj instance methods
// TODO: assert return values of Object/FutureObj static methods
let resolved = undefined;
const fetchJson = val => new Promise((res, rej) => {
  setTimeout(() => {
    try {
      Scheduler.unstable_yieldValue('Promise Resolved')
      res(expectedJSON(val))
    } catch (err) {
      rej(err)
    }

  }, 100);
}).catch(err => {throw err});
const App = ({ inRender  }) => {
  return <Suspense fallback={<div>Loading...</div>}>
    <LogSuspense action={inRender}>
      <div>
        foo
    </div> 
    </LogSuspense>
  </Suspense>

};

const LogSuspense = ({ action }) => {
  try {
    const val = action();
    Scheduler.unstable_yieldValue('No Suspense');
    if(isEffect(val)) {
      suspend(val);
    }
    if(typeof val !== 'undefined') {
      resolved = val;
    }
    return 'foo';
  } catch (promise) {
    if (typeof promise.then === 'function') {
      Scheduler.unstable_yieldValue(`Suspend!`);
    } 
    throw promise
  }

}
let FutureObj;
let container;
let Scheduler;
beforeEach(() => {
  jest.resetModules();
  Scheduler = require('scheduler/unstable_mock');
  container = document.createElement('div');
  document.body.appendChild(container);
  FutureObj = createFutureObject(fetchJson);
});

afterEach(() => {
  document.body.removeChild(container);
  container = null;
  FutureObj.reset();
  FutureObj = null;
  Scheduler.unstable_clearYields();
  Scheduler = null;
  resolved = null;
});

describe('Object static methods', () => {
  getterObjectStaticEach('Expect static getter $staticMethod to suspend in render and throw outside render', async ({ staticMethod }) => {
    const futureObj = new FutureObj(1);
    const method = typeof staticMethod === 'string' ? Object[staticMethod] : staticMethod;

    const inRender =  () => method(futureObj);
    const outsideRender = () => expect(() => method(futureObj)).toThrowError(/** TODO: outofrender error */);

    act(() => {
      outsideRender();
    });

    let renderer;
    act(() => {
      renderer = render(<App inRender={inRender} />, container)  
    });
    const {getByText} = renderer;
    expect(Scheduler).toHaveYielded([
      'Suspend!'
    ]);

    jest.runTimersToTime(150);
    expect(Scheduler).toHaveYielded([
      'Promise Resolved',
    ]);
    await waitForSuspense(0);
    await waitFor(() => getByText('foo'))
    expect(Scheduler).toHaveYielded([          
      'No Suspense',
    ])
    const expected = method(expectedJSON(1))
    expect(resolved).toEqual(expected);
  });

  noopObjectStaticEach('Expect method $staticMethod to do nothing', async ({ staticMethod }) => {
    const futureObj = new FutureObj(1);
    const method = typeof staticMethod === 'string' ? Object[staticMethod] : staticMethod;

    const inRender =  () => {
      expect(() => method(futureObj)).not.toThrow(Promise);
      //TODO: add more error types
      expect(() => method(futureObj)).not.toThrow(Error);

      expect(unwrapProxy(method(futureObj))).toBe(undefined);
      expect(unwrapProxy(method(futureObj))).toBe(undefined);
    };
    const outsideRender = inRender;

    act(() => {
      outsideRender();
    });

    let renderer;
    act(() => {
      renderer = render(<App inRender={inRender} />, container)  
    });
    const {getByText} = renderer;

    expect(Scheduler).toHaveYielded(['No Suspense']);
    await waitForSuspense(150);
    await waitFor(() => getByText('foo'))
    expect(Scheduler).toHaveYielded([          
      "Promise Resolved"
    ]);
  });
  mutableObjectStaticEach('Expect mutable method $staticMethod to throw in render and defer outside render', async ({ staticMethod, returnType }) => {
    const futureObj = new FutureObj(1);
    const method = typeof staticMethod === 'string' ? Object[staticMethod] : staticMethod;
    // TODO: specify error
    const inRender = () => expect(() => method(futureObj)).toThrowError();

    const outsideRender = () => {
      let Constructor;
      if(returnType === 'object') {
        Constructor = TransparentObjectEffect;
      }
      if(returnType === 'array') {
        Constructor = TransparentArrayEffect;
      }
      
      expect(unwrapProxy(method(futureObj))).toBeInstanceOf(Constructor)
    };

    act(() => {
      outsideRender();
    });


    let renderer;
    act(() => {
      renderer = render(<App inRender={inRender} />, container)  
    });
    jest.runTimersToTime(150);

  });
  invalidObjectStaticEach('Expect method $staticMethod to error both in and out of render', ({staticMethod}) => {
    const futureObj = new FutureObj(1);
    const method = typeof staticMethod === 'string' ? Object[staticMethod] : staticMethod;

    const inRender = () => expect(() => method(futureObj)).toThrowError(/** TODO: outofrender error */);
    const outsideRender = inRender;

    act(() => {
      outsideRender();
    });

    let renderer;
    act(() => {
      renderer = render(<App inRender={inRender} />, container)  
    });
    jest.runTimersToTime(150);

  })
});