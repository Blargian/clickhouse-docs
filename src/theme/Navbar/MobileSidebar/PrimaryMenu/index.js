import React from 'react';
import Navigation from '../../../../components/Navigation';

// The primary menu displays the navbar items
export default function NavbarMobilePrimaryMenu() {
  return (
    <>
      <Navigation className='ch-nav-v2-mobile-item' />
      <div className="nav-items-btns">
        <a href="https://clickhouse.cloud/signIn" className="sign-in ch-menu">
          <button className="click-button">Sign in</button>
        </a>
        <a href="https://clickhouse.cloud/signUp" className="click-button-anchor">
          <button className="click-button primary-btn">Get started</button>
        </a>
      </div>
    </>
  );
}
