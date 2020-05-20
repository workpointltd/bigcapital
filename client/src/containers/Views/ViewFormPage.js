import React, {useEffect, useState, useMemo, useCallback} from 'react';
import { useAsync } from 'react-use';
import { useParams } from 'react-router-dom';
import { Intent, Alert } from '@blueprintjs/core';
import { FormattedMessage as T, FormattedHTMLMessage, useIntl } from 'react-intl';

import DashboardInsider from 'components/Dashboard/DashboardInsider';
import DashboardPageContent from 'components/Dashboard/DashboardPageContent';
import ViewForm from 'containers/Views/ViewForm';

import AppToaster from 'components/AppToaster';
import {compose} from 'utils';
import { If } from 'components';

import withResourcesActions from 'containers/Resources/withResourcesActions';
import withViewsActions from 'containers/Views/withViewsActions';
import withDashboard from 'containers/Dashboard/withDashboard';


// @flow
function ViewFormPage({
  changePageTitle,
  changePageSubtitle,

  requestFetchResourceFields,
  requestFetchResourceColumns,
  requestFetchViewResource,

  requestFetchView,
  requestDeleteView,
}) {
  const { resource_slug: resourceSlug, view_id: viewId } = useParams();
  const [stateDeleteView, setStateDeleteView] = useState(null);

  const { formatMessage } = useIntl();  

  const fetchHook = useAsync(async () => {
    return Promise.all([
      ...(resourceSlug) ? [
        requestFetchResourceColumns(resourceSlug),
        requestFetchResourceFields(resourceSlug),
      ] : (viewId) ? [
        requestFetchViewResource(viewId),
      ] : [],
      ...(viewId) ? [
        requestFetchView(viewId),
      ] : [],
    ]);
  }, []);

  useEffect(() => {
    if (viewId) {
      changePageTitle(formatMessage({id:'edit_custom_view'}));
    } else {
      changePageTitle(formatMessage({id:'new_custom_view'}));
    }
    return () => {
      changePageTitle('');
    };
  }, [viewId, changePageTitle]);


  // Handle delete view button click.
  const handleDeleteView = useCallback((view) => {
    setStateDeleteView(view);
  }, []);

  // Handle cancel delete button click.
  const handleCancelDeleteView = useCallback(() => {
    setStateDeleteView(null);
  }, []);

  // Handle confirm delete custom view.
  const handleConfirmDeleteView = useCallback(() => {
    requestDeleteView(stateDeleteView.id).then((response) => {
      setStateDeleteView(null);
      AppToaster.show({
        message: formatMessage({
          id: 'the_custom_view_has_been_successfully_deleted',
        }),
        intent: Intent.SUCCESS,
      });
    })
  }, [requestDeleteView, stateDeleteView]);

  return (
    <DashboardInsider
      name={'view-form'}
      loading={fetchHook.loading}
      mount={false}>
      <DashboardPageContent>
        <If condition={fetchHook.value}>
          <ViewForm
            viewId={viewId}
            resourceName={resourceSlug}
            onDelete={handleDeleteView} />

          <Alert
            cancelButtonText={<T id={'cancel'}/>}
            confirmButtonText={<T id={'delete'}/>}
            icon="trash"
            intent={Intent.DANGER}
            isOpen={stateDeleteView}
            onCancel={handleCancelDeleteView}
            onConfirm={handleConfirmDeleteView}>
            <p>
              <FormattedHTMLMessage
                id={'once_delete_these_views_you_will_not_able_restore_them'} />
            </p>
          </Alert>
        </If>

        <If condition={fetchHook.error}>
          <h4><T id={'something_wrong'}/></h4>
        </If>
      </DashboardPageContent>
    </DashboardInsider>   
  );
}

export default compose(
  withDashboard,
  withViewsActions,
  withResourcesActions
)(ViewFormPage);