import React from 'react';
import ApiDoc from './doc';
import data from './oneapi.json';
export default () => <ApiDoc schema={data.http} />;