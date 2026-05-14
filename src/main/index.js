import React from "react";
import { Switch, Route } from "react-router-dom";
import Aside from "../components/aside";
import Footer from "../components/footer";
import TopBar from "../components/topbar";
import Dashboard from "./dashboard";
import Home from "./Home";
import UserQuery from "../main/User/User query/index";
import UserList from "./User/User list";
import CreateUsers from "./system management/User";
import OrderList from "./Order Center/order list";
import OrderLending from "./Order Center/order lending";
import OrderLending2 from "./Order Center/order lending2";
import OrderRepayment from "./Order Center/order repayment";
import OrderRepaymentReview from "./Order Center/order repayment review";
import ApplyExtension from "./Order Center/apply extension";
import FailedDisbursements from "./Order Center/failed disburse";
import BouncedBackDisbursements from "./Order Center/Bounced Back";
import DistributeCreditCases from "./Credit audit center/Distribute credit cases";
import ListOfCreditCases from "./Credit audit center/List of credit cases";
import AnalysisOfCreditAudit from "./Credit audit center/analysis of credit audit";
import ReviewStaffSchedule from "./Credit audit center/Review staff schedule";
import AdvanceCaseList from "./PreCollection Center/advance cases list";
import PrePaymentRecords from "./PreCollection Center/Payment records";
import PreCollectionSet from "./PreCollection Center/PreCollection set";
import PreCollectionSchedule from "./PreCollection Center/Precollection schedule";
import PreCollectionRanking from "./PreCollection Center/Ranking";
import ListOfCollectionCases from "./collection center/list of collection cases";
import CollectionPaymentRecords from "./collection center/repayment records";
import CollectionSchedule from "./collection center/collection schedule";
import CollectionRanking from "./collection center/ranking";
import PreCollectionReport from "./Data Center/performance report/PreCollection Report";
import CollectionReport from "./Data Center/performance report/Collection report";
import PerformanceAnalysis from "./Data Center/performance report/Analysis";
import LendingRecords from "./Data Center/Business data/Lending records";
import RepaymentRecords from "./Data Center/Business data/Repayment records";
import ExtensionRecords from "./Data Center/Business data/Extension records";
import ChineseWorld from "./Data Center/Business data/chinese word";
import RecoveryDataCenter from "./Data Center/Data";
import { AuthContext } from "../libs/context/authContext";
import Auth from "../auth";
import Balance from "../components/rowDetails/balance";
import ManualPaymentPool from "./Order Center/Manual payment pool";
import PublicTransfare from "../components/rowDetails/publicTransfare";
import GlobalContextProvider, { GlobalContext } from "../libs/context/globalContext";
import CustomizedSnackbars from "../components/alerts";
import ManualDisburse from "./Credit audit center/Manual Desburse";
import { getVisibleNavigation, hasPermission } from "../config/navigation";
import BigLoader from "../components/loaders/bigLoader";

import ReviewLoanDetails from "./Credit audit center/rvLoanDetails";

import CollectionLoanDetails from "./collection center/colLoanDetails";
import PreLoanDetails from "./PreCollection Center/preColLoanDetails";
import SystemConfig from "./system management/Config";
import AuditLogs from "./system management/Audit Logs";
import ErrorLogs from "./system management/Error Logs";
import SystemDocs from "./system management/Docs";
import FundPayments from "./Fund Management/Payments";
import FailedPayments from "./Fund Management/Failed Payments";
import FundAirtime from "./Fund Management/Airtime";
import FailedAirtime from "./Fund Management/Failed Airtime";
import BatchPayments from "./Fund Management/Batch Payments";
import BatchTalktime from "./Fund Management/Batch Talktime";

function GuardedRoute({ component: Component, allow, ...rest }) {
  return (
    <Route
      {...rest}
      render={(props) => (allow ? <Component {...props} /> : <Home />)}
    />
  );
}

function MainAppShell({ alerts, sidebarOpen, setSidebarOpen, canDo, canOpenPath }) {
  const { bootstrapLoading } = React.useContext(GlobalContext);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <CustomizedSnackbars />
      <Aside isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <TopBar
          alerts={alerts}
          onMenuToggle={() => setSidebarOpen((current) => !current)}
        />
        <main className="relative px-4 py-6 sm:px-6 lg:px-8">
          {bootstrapLoading ? (
            <div className="absolute inset-0 z-20 flex items-start justify-center bg-slate-50/90 px-4 py-10 backdrop-blur-[2px]">
              <div className="flex min-w-[240px] max-w-sm flex-col items-center rounded-3xl border border-slate-200 bg-white px-6 py-6 text-center shadow-sm">
                <BigLoader />
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  Loading your workspace
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Dashboard cards, tables, and staff data are syncing now.
                </p>
              </div>
            </div>
          ) : null}
          <Switch>
            <Route exact path="/" component={Home} />
            <GuardedRoute
              path="/dashboard"
              component={Dashboard}
              allow={canDo("action:dashboard:view") && canOpenPath("/dashboard")}
            />
            <Route exact path="/user-query" component={UserQuery} />
            <Route path="/user-list" component={UserList} />
            <Route path="/create-users" component={CreateUsers} />
            <GuardedRoute
              path="/system-config"
              component={SystemConfig}
              allow={canOpenPath("/system-config")}
            />
            <GuardedRoute
              path="/system-audit-logs"
              component={AuditLogs}
              allow={canOpenPath("/system-audit-logs")}
            />
            <GuardedRoute
              path="/system-error-logs"
              component={ErrorLogs}
              allow={canOpenPath("/system-error-logs")}
            />
            <GuardedRoute
              path="/system-docs"
              component={SystemDocs}
              allow={canOpenPath("/system-docs")}
            />
            <Route path="/order-list" component={OrderList} />
            <Route path="/order-lending" component={OrderLending} />
            <Route path="/order-repayment" component={OrderRepayment} />
            <Route path="/loan-details" component={ReviewLoanDetails} />
            <Route path="/pre-loan-details" component={PreLoanDetails} />
            <Route
              path="/collection-loan-details"
              component={CollectionLoanDetails}
            />
            <Route
              exact
              path="/order-repayment-review"
              render={(props) =>
                canOpenPath("/order-repayment-review") ? (
                  <OrderRepaymentReview {...props} />
                ) : (
                  <Home />
                )
              }
            />
            <Route
              path="/order-repayment-review/balance/"
              children={canDo("action:payment:review") ? <Balance /> : <Home />}
            />
            <Route
              path="/order-repayment-review/public-transfare/"
              children={canDo("action:payment:review") ? <PublicTransfare /> : <Home />}
            />
            <Route path="/apply-extension" component={ApplyExtension} />
            <Route
              path="/distribute-credit-cases"
              component={DistributeCreditCases}
            />
            <Route path="/credit-case-list" component={ListOfCreditCases} />
            <Route
              path="/credit-audit-analysis"
              component={AnalysisOfCreditAudit}
            />
            <Route
              path="/review-staff-schedule"
              component={ReviewStaffSchedule}
            />
            <GuardedRoute
              path="/advance-case-list"
              component={AdvanceCaseList}
              allow={canOpenPath("/advance-case-list")}
            />
            <Route
              path="/prepayment-records"
              component={PrePaymentRecords}
            />
            <Route path="/precollection-set" component={PreCollectionSet} />
            <Route
              path="/pre-collection-schedule"
              component={PreCollectionSchedule}
            />
            <Route path="/pre-ranking" component={PreCollectionRanking} />
            <GuardedRoute
              path="/collection-cases"
              component={ListOfCollectionCases}
              allow={canOpenPath("/collection-cases")}
            />
            <Route
              path="/collection-payment-records"
              component={CollectionPaymentRecords}
            />
            <Route
              path="/collection-schedule"
              component={CollectionSchedule}
            />
            <Route
              path="/collection-ranking"
              component={CollectionRanking}
            />
            <Route
              path="/pre-collection-report"
              component={PreCollectionReport}
            />
            <Route path="/collection-report" component={CollectionReport} />
            <Route
              path="/performance-analysis"
              component={PerformanceAnalysis}
            />
            <Route path="/lending-records" component={LendingRecords} />
            <Route path="/repayment-records" component={RepaymentRecords} />
            <Route path="/extension-records" component={ExtensionRecords} />
            <Route path="/chinese-word" component={ChineseWorld} />
            <Route path="/data-center-data" component={RecoveryDataCenter} />
            <GuardedRoute
              path="/fund-payments"
              component={FundPayments}
              allow={canOpenPath("/fund-payments")}
            />
            <GuardedRoute
              path="/fund-failed-payments"
              component={FailedPayments}
              allow={canOpenPath("/fund-failed-payments")}
            />
            <GuardedRoute
              path="/fund-airtime"
              component={FundAirtime}
              allow={canOpenPath("/fund-airtime")}
            />
            <GuardedRoute
              path="/fund-failed-airtime"
              component={FailedAirtime}
              allow={canOpenPath("/fund-failed-airtime")}
            />
            <GuardedRoute
              path="/fund-batch-payments"
              component={BatchPayments}
              allow={canOpenPath("/fund-batch-payments")}
            />
            <GuardedRoute
              path="/fund-batch-talktime"
              component={BatchTalktime}
              allow={canOpenPath("/fund-batch-talktime")}
            />
            <Route path="/order-lending2" component={OrderLending2} />
            <Route
              path="/manual-payment-pool"
              component={ManualPaymentPool}
            />
            <Route
              path="/failed-disbursements"
              component={FailedDisbursements}
            />
            <Route
              path="/bounced-back-disbursements"
              component={BouncedBackDisbursements}
            />
            <Route
              path="/manual-disbursement"
              render={(props) =>
                canOpenPath("/manual-disbursement") &&
                canDo("action:disbursement:manual") ? (
                  <ManualDisburse {...props} />
                ) : (
                  <Home />
                )
              }
            />
          </Switch>
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default function Main() {
  const { isLogged, alerts, user } = React.useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const userRole = user?.role || "";
  const userPermissions = React.useMemo(
    () => user?.permissions || [],
    [user?.permissions]
  );
  const visibleNavigation = React.useMemo(
    () => getVisibleNavigation(userRole, userPermissions),
    [userPermissions, userRole]
  );

  const canOpenPath = React.useCallback(
    (path) => {
      const matchesItem = (item) => {
        if (item.path === path) return true;
        if (Array.isArray(item.children)) {
          return item.children.some(matchesItem);
        }
        return false;
      };

      return visibleNavigation.some(matchesItem);
    },
    [visibleNavigation]
  );

  const canDo = React.useCallback(
    (permissionKey) => hasPermission(userRole, userPermissions, permissionKey),
    [userPermissions, userRole]
  );

  if (!isLogged) return <Auth />;

  if (isLogged)
    return (
      <GlobalContextProvider>
        <MainAppShell
          alerts={alerts}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          canDo={canDo}
          canOpenPath={canOpenPath}
        />
      </GlobalContextProvider>
    );
}
