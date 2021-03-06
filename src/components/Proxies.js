import React from 'react';

import { connect } from './StateProvider';

import Button from './Button';
import ContentHeader from './ContentHeader';
import ProxyGroup from './ProxyGroup';
import BaseModal from './shared/BaseModal';
import Settings from './proxies/Settings';
import Equalizer from './svg/Equalizer';
import { Zap } from 'react-feather';

import ProxyProviderList from './ProxyProviderList';
import { Fab } from 'react-tiny-fab';

import './rtf.css';
import s0 from './Proxies.module.css';

import {
  getDelay,
  getProxyGroupNames,
  getProxyProviders,
  fetchProxies,
  requestDelayAll,
} from '../store/proxies';
import { getClashAPIConfig } from '../store/app';

const { useState, useEffect, useCallback, useRef } = React;

function Proxies({ dispatch, groupNames, delay, proxyProviders, apiConfig }) {
  const refFetchedTimestamp = useRef({});
  const requestDelayAllFn = useCallback(
    () => dispatch(requestDelayAll(apiConfig)),
    [apiConfig, dispatch]
  );

  const fetchProxiesHooked = useCallback(() => {
    refFetchedTimestamp.current.startAt = new Date();
    dispatch(fetchProxies(apiConfig)).then(() => {
      refFetchedTimestamp.current.completeAt = new Date();
    });
  }, [apiConfig, dispatch]);
  useEffect(() => {
    // fetch it now
    fetchProxiesHooked();

    // arm a window on focus listener to refresh it
    const fn = () => {
      if (
        refFetchedTimestamp.current.startAt &&
        new Date() - refFetchedTimestamp.current.startAt > 3e4 // 30s
      ) {
        fetchProxiesHooked();
      }
    };
    window.addEventListener('focus', fn, false);
    return () => window.removeEventListener('focus', fn, false);
  }, [fetchProxiesHooked]);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const closeSettingsModal = useCallback(() => {
    setIsSettingsModalOpen(false);
  }, []);

  return (
    <>
      <div className={s0.topBar}>
        <Button kind="minimal" onClick={() => setIsSettingsModalOpen(true)}>
          <Equalizer size={16} />
        </Button>
      </div>
      <BaseModal
        isOpen={isSettingsModalOpen}
        onRequestClose={closeSettingsModal}
      >
        <Settings />
      </BaseModal>
      <ContentHeader title="Proxies" />
      <div>
        {groupNames.map((groupName) => {
          return (
            <div className={s0.group} key={groupName}>
              <ProxyGroup
                name={groupName}
                delay={delay}
                apiConfig={apiConfig}
                dispatch={dispatch}
              />
            </div>
          );
        })}
      </div>
      <ProxyProviderList items={proxyProviders} />
      <div style={{ height: 60 }} />
      <Fab
        icon={<Zap width={16} />}
        onClick={requestDelayAllFn}
        text="Test Latency"
      ></Fab>
    </>
  );
}

const mapState = (s) => ({
  apiConfig: getClashAPIConfig(s),
  groupNames: getProxyGroupNames(s),
  proxyProviders: getProxyProviders(s),
  delay: getDelay(s),
});

export default connect(mapState)(Proxies);
