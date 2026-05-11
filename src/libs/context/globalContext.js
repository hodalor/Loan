import React from "react";
import { useHistory } from "react-router-dom";
import socket from "../socket";
import {
  _confirmClearBalance,
  _confirmClearPublic,
  _createAdmin,
  _createCallRecord,
  _createClearPublic,
  _createClearRecBalance,
  _createPreCollCallRecord,
  _createStaffGroup,
  _createUser,
  _deleteStaffGroup,
  _fetchDataHandler,
  _getCustomerById,
  _handleGrantLoan,
  _handleRejectLoan,
  _markManualDisbursement,
  _retryDisbursement,
  _updateStaffGroup,
  _updateUser,
} from "../../handlers";
import { _sortAdmins, _sortCustomers, _sortLoans } from "../autoSort";
import { AuthContext } from "./authContext";
import _filterUser from "../search/filterUser";
import _findCustomer from "../search/findCustomer";
import _structureData from "../dataStructure";
import _filterCases from "../search/filterNewCases";
import _filterAssignedCases from "../search/filterAssignedCases";
import {
  _getColLoans,
  _getColPayRecs,
  _getPreColLoans,
  _getPreColPayRecs,
} from "../checkDuration";
import _filterDis from "../search/filterdis";
import _findByDate from "../search/findByDate";
import _filterPreCases from "../search/filterPreLoans";
import _filterAssPreCases from "../search/filterAssPre";
import _filterPreCompCases from "../search/preComp";
import _filterPrePayRec from "../search/findPrePayRec";
import _filterColCases from "../search/findCompCases";
import _filterAssColCases from "../search/findAssColCases";
import _createCollCallRecord from "../../handlers/creates/colCallRec";
import _filterCompColCases from "../search/findCompColCase";
import _filterColPayRec from "../search/findColPayRec";
import _filterLoan from "../search/findLoan";
import _filterManualPayment from "../search/findManualPayment";
import _updateIDCard from "../../handlers/updates/uploadId";
import _getPreRankRec from "../ranking/precolRank";
import _sortRank from "../autoSort/sortRank";
import _getPreRankRecCase from "../ranking/preRankCase";
import _sortRankCase from "../autoSort/rankCase";
import _getColRankRec from "../ranking/colRank";
import _getColRankRecCase from "../ranking/colRankCase";
import { hasPermission } from "../../config/navigation";
import { getGroupsByDepartment } from "../staffGroups";

const isSettledPaymentStatus = (status = "") =>
  ["Payed", "Paid"].includes(String(status || "").trim());
const hasRecordedRepayment = (loan = {}) =>
  Number.parseFloat(loan?.amountPaid || 0) > 0 ||
  (Array.isArray(loan?.paymentRecords) && loan.paymentRecords.length > 0);

export const GlobalContext = React.createContext();

export default function GlobalContextProvider(props) {
  const history = useHistory();
  const ADMIN_CACHE_VERSION = 2;

  const { setIsLogged } = React.useContext(AuthContext);

  const [activeStep, setActiveStep] = React.useState(0);
  const [selectedRadio, setSelectedRadio] = React.useState("");
  const [imageToView, setImageToView] = React.useState("");

  const roles = [
    { label: "Super Admin", value: "super-admin" },
    { label: "Admin", value: "admin" },
    { label: "Rev team Lead", value: "rv-team-lead" },
    { label: "Pre-coll team Lead", value: "pre-team-lead" },
    { label: "Coll team Lead", value: "col-team-lead" },
    { label: "Review", value: "rev-personel" },
    { label: "Pre-collection", value: "pre-personel" },
    { label: "Collection", value: "col-personel" },
  ];

  const departments = [
    { label: "Management", value: "management" },
    { label: "Review", value: "review" },
    { label: "Collection", value: "collection" },
    { label: "Pre-collection", value: "pre-collection" },
  ];

  const relationship = [
    { label: "Personal", value: "personal" },
    { label: "Parent", value: "parent" },
    { label: "Sibling", value: "sibling" },
    { label: "Friend", value: "friend" },
    { label: "Spouse", value: "spouse" },
    { label: "Other", value: "other" },
  ];

  const callResult = [
    { label: "Answered", value: "answered" },
    { label: "Not answered", value: "not answered" },
    { label: "Switched off", value: "switched off" },
    { label: "Unregistered", value: "unregistered" },
  ];

  const genders = [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
    { label: "Other", value: "other" },
  ];

  const loanTypes = [
    { label: "First loan", value: "firstLoan" },
    { label: "Re-loan", value: "reLoan" },
  ];

  const preColDays = [
    { label: "T0", value: "T0" },
    { label: "T1", value: "T1" },
    { label: "T2", value: "T2" },
  ];

  const preCaseStatus = [
    { label: "Cases not recorded", value: "caseNotRecorded" },
    { label: "Recorded Cases", value: "recordedCase" },
  ];

  const [openModal, setModal] = React.useState(false);

  const [addUserModal, setaddUserModal] = React.useState(false);

  const [callRecords, setCallRecordsModal] = React.useState(false);

  const [assignModal, setAssignModal] = React.useState(false);

  const [loanDetailsModals, setLoanDetailsModal] = React.useState(false);

  const [dateRange, setRange] = React.useState(null);

  const [modalTitle, setmodalTitle] = React.useState("");

  const [filterType, setFilterType] = React.useState("");

  const [isEdit, setIsEdit] = React.useState(false);

  const [userDetails, setUserDetails] = React.useState({});

  const [select, setSelect] = React.useState({
    loanType: "",
    staff: "",
    days: "",
    caseStatus: "",
    advanceStaff: "",
    collectionStaff: "",
    reviewGroup: "",
    advanceGroup: "",
    collectionGroup: "",
    role: "",
    department: "",
    gender: "",
    relationship: "",
    callResult: "",
    preDays: "",
  });

  const [inputs, setInput] = React.useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    userName: "",
    password: "",
    date: "",
    userId: "",
    customerLevel: "",
    idCard: "",
    ghCard: "",
    eduLevelCon3: "",
    releCon3: "",
    phoneCon3: "",
    nameCon3: "",
    eduLevelCon2: "",
    releCon2: "",
    phoneCon2: "",
    nameCon2: "",
    eduLevelCon1: "",
    releCon1: "",
    phoneCon1: "",
    nameCon1: "",
    wkLandMark: "",
    wrkLocality: "",
    wkDAddress: "",
    inc: "",
    ind: "",
    wkHrs: "",
    wCont: "",
    wrkUni: "",
    bupPh: "",
    eduLev: "",
    inSchool: "",
    resiYrs: "",
    resiType: "",
    aLndMark: "",
    dAddress: "",
    aor: "",
    mStatus: "",
    loanId: "",
    daysToFrom: "",
    amount: "",
    check: false,
    remarks: "",
    image: null,
    idFrontImage: null,
    idBackImage: null,
    livePhotoImage: null,
  });

  const [user, setUser] = React.useState({});

  const [customers, setCustomers] = React.useState([]);

  const [customer, setCustomer] = React.useState({});
  const [customerProfileLoading, setCustomerProfileLoading] = React.useState(false);
  const customerDetailsRequestRef = React.useRef(0);

  const [loan, setLoan] = React.useState({});

  const [originalData, setOriginalData] = React.useState([]);

  const [originalData2, setOriginalData2] = React.useState([]);

  const [loans, setLoans] = React.useState([]);

  const [inComingLoans, setInComingLoans] = React.useState([]);

  const [assignedCases, setAssignedCases] = React.useState([]);

  const [completedCases, setCompletedCases] = React.useState([]);

  const [disbursed, setDisbursed] = React.useState([]);

  const [preCollectionCases, setPreCollectionCases] = React.useState([]);

  const [collectionCases, setCollectionCases] = React.useState([]);

  const [assignedPreColCases, setAssPreColCases] = React.useState([]);

  const [assignedColCases, setAssColCases] = React.useState([]);

  const [completedColCases, setCompColCases] = React.useState([]);

  const [colPayRecs, setColPayCases] = React.useState([]);

  const [clearanceRecords, setClearanceRecords] = React.useState([]);

  const [clearedCases, setClearedCases] = React.useState([]);

  const [preRank, setPreRank] = React.useState([]);

  const [colRank, setColRank] = React.useState([]);

  const [preRankCase, setPreRankCase] = React.useState([]);

  const [colRankCase, setColRankCase] = React.useState([]);

  const [balClearanceRecords, setBalClearanceRecords] = React.useState([]);

  const [preCompCases, setPreCompCases] = React.useState([]);

  const [prePayment, setPrePayment] = React.useState([]);

  const [globalLoader, setGlobalLoader] = React.useState(false);
  const [bootstrapLoading, setBootstrapLoading] = React.useState(true);
  const [actionLoaders, setActionLoaders] = React.useState({});

  const [admins, setAdmins] = React.useState([]);
  const [staffGroups, setStaffGroups] = React.useState([]);

  const [selectedCases, setSelectedCases] = React.useState([]);

  const [bigLoader, setBigLoader] = React.useState(false);

  const [radio, setRadio] = React.useState("");

  const [aside, setAside] = React.useState({
    homeTab: "nav-link active",
    userTab: "nav-link",
    userNavItem: "nav-item",
    orderTab: "nav-link",
    orderNavItem: "nav-item",
    creditTab: "nav-link",
    creditNavItem: "nav-item",
    preColTab: "nav-link",
    preColNavItem: "nav-item",
    colTab: "nav-link",
    colNavItem: "nav-item",
    dataCenterTab: "nav-link",
    dataNavItem: "nav-item",
    sysManTab: "nav-link",
    sysNavItem: "nav-item",
  });

  const [alerts, setAlerts] = React.useState({
    open: false,
    msg: "",
    type: "",
  });
  const SOCKET_ACTION_TIMEOUT_MS = 45000;

  const ensureSocketConnected = React.useCallback(() => {
    if (socket.connected) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      let settled = false;

      const cleanup = () => {
        socket.off("connect", handleConnect);
        socket.off("connect_error", handleConnectError);
      };

      const handleConnect = () => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve();
      };

      const handleConnectError = (error) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error);
      };

      socket.on("connect", handleConnect);
      socket.on("connect_error", handleConnectError);
      socket.connect();

      setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error("Socket connection timed out."));
      }, 10000);
    });
  }, []);

  const setActionLoading = React.useCallback((actionKey, value) => {
    if (!actionKey) return;

    setActionLoaders((current) => {
      if (value) {
        return {
          ...current,
          [actionKey]: true,
        };
      }

      if (!current[actionKey]) {
        return current;
      }

      const next = { ...current };
      delete next[actionKey];
      return next;
    });
  }, []);

  const isActionLoading = React.useCallback(
    (actionKey) => Boolean(actionLoaders[actionKey]),
    [actionLoaders]
  );

  const emitWithAck = React.useCallback(async (eventName, payload, timeoutMessage) => {
    try {
      await ensureSocketConnected();
    } catch (error) {
      return {
        success: false,
        message:
          error?.message ||
          "Real-time connection is unavailable. Refresh and try again.",
      };
    }

    return new Promise((resolve) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;

        settled = true;
        resolve({
          success: false,
          timedOut: true,
          message:
            timeoutMessage ||
            "The request took too long to finish. Please refresh and try again.",
        });
      }, SOCKET_ACTION_TIMEOUT_MS);

      const finish = (response = {}) => {
        if (settled) return;

        settled = true;
        clearTimeout(timer);
        resolve(response);
      };

      if (typeof payload === "undefined") {
        socket.emit(eventName, finish);
        return;
      }

      socket.emit(eventName, payload, finish);
    });
  }, [ensureSocketConnected]);

  const _hasAccess = React.useCallback(
    (permissionKey) =>
      hasPermission(user?.role || "", user?.permissions || [], permissionKey),
    [user?.permissions, user?.role]
  );

  const personnelLoading = bootstrapLoading && admins.length === 0;

  const _toCustomerSummary = React.useCallback((customerData = {}) => {
    const loanItems = Array.isArray(customerData?.loan?.loans)
      ? customerData.loan.loans
      : [];

    return {
      _id: customerData?._id,
      userId: customerData?.userId || "",
      phone: customerData?.phone || "",
      isActive: Boolean(customerData?.isActive),
      isVerified: Boolean(customerData?.isVerified),
      level: customerData?.level || "",
      createdAt: customerData?.createdAt || null,
      countryCode: customerData?.countryCode || "",
      countryName: customerData?.countryName || "",
      countryDialCode: customerData?.countryDialCode || "",
      locale: customerData?.locale || "",
      timeZone: customerData?.timeZone || "",
      currencyCode: customerData?.currencyCode || "",
      currencySymbol: customerData?.currencySymbol || "",
      IDinfo: {
        firstName: customerData?.IDinfo?.firstName || "",
        middleName: customerData?.IDinfo?.middleName || "",
        lastName: customerData?.IDinfo?.lastName || "",
        gender: customerData?.IDinfo?.gender || "",
        gCardNumber: customerData?.IDinfo?.gCardNumber || "",
      },
      loan: {
        isApplied: Boolean(customerData?.loan?.isApplied),
        loanStatus: customerData?.loan?.loanStatus || "",
        paymentStatus: customerData?.loan?.paymentStatus || "",
        acumulatedOverDue: customerData?.loan?.acumulatedOverDue,
        loans: loanItems.map((loan) => ({ ID: loan?.ID || "" })),
      },
    };
  }, []);

  const _loadCustomerDetails = React.useCallback(
    async (customerSummary = {}, { silent = false } = {}) => {
      const customerId = customerSummary?._id;
      const requestId = customerDetailsRequestRef.current + 1;
      customerDetailsRequestRef.current = requestId;

      if (!customerId) {
        if (!silent) {
          setAlerts((current) => ({
            ...current,
            type: "warning",
            msg: "Customer details could not be loaded.",
            open: true,
          }));
        }

        return null;
      }

      setCustomerProfileLoading(true);

      try {
        const response = await _getCustomerById(customerId);

        if (response.success === 0 || !response.data) {
          if (!silent) {
            setAlerts((current) => ({
              ...current,
              type: "error",
              msg: response.message || "Customer details could not be loaded.",
              open: true,
            }));
          }

          return null;
        }

        if (customerDetailsRequestRef.current !== requestId) {
          return null;
        }

        setCustomer(response.data);
        return response.data;
      } catch (error) {
        console.log(error);

        if (!silent) {
          setAlerts((current) => ({
            ...current,
            type: "error",
            msg: "Customer details could not be loaded.",
            open: true,
          }));
        }

        return null;
      } finally {
        if (customerDetailsRequestRef.current === requestId) {
          setCustomerProfileLoading(false);
        }
      }
    },
    []
  );

  React.useEffect(() => {
    // Initial bootstrap happens once when the admin app mounts.
    _getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const _getAdminCacheKey = React.useCallback(
    (userId) => `admin-data-cache:v${ADMIN_CACHE_VERSION}:${userId}`,
    [ADMIN_CACHE_VERSION]
  );

  const _applyFetchedData = React.useCallback(
    async (payload = {}, userId = "", { persist = false } = {}) => {
      const rawLoans = Array.isArray(payload.loans) ? payload.loans : [];
      const users = Array.isArray(payload.users) ? payload.users : [];
      const adminData = Array.isArray(payload.admins) ? payload.admins : [];
      const groupData = Array.isArray(payload.staffGroups) ? payload.staffGroups : [];
      const tda = new Date();

      const [sortedCustomers, sortedAdmins] = await Promise.all([
        _sortCustomers(users),
        _sortAdmins(adminData),
      ]);
      const sortedLoans = [...rawLoans]
        .map((loan) => {
          const loanDate = new Date(loan.dop);
          const timeDiff = loanDate.getTime() - tda.getTime();
          const diffDate = timeDiff / (1000 * 3600 * 24);
          const dur = parseInt(diffDate, 10);

          return {
            ...loan,
            doa: new Date(loan.doa),
            dur,
          };
        })
        .sort((a, b) => b.doa - a.doa);

      const newLoans = [];
      const assigned = [];
      const publicClearRec = [];
      const balanceClearRec = [];
      const completed = [];
      const disburse = [];
      const preCompletedCases = [];
      const collCompletedCases = [];
      const clearedCases = [];

      sortedLoans.forEach((loan) => {
        const clearanceType = loan.clearanceRecord?.recordType;
        const colCallRec = loan.collCallRecords?.length || 0;
        const preCallRec = loan.preCollCallRecords?.length || 0;

        if (loan.isNewLoan === true && loan.rvOfName === "") newLoans.push(loan);
        if (loan.rvOfName !== "") assigned.push(loan);
        if (loan.clearanceFlag === true && clearanceType !== "balance")
          publicClearRec.push(loan);
        if (loan.clearanceFlag === true && clearanceType === "balance")
          balanceClearRec.push(loan);
        if (loan.loanStatus !== "Review") completed.push(loan);
        if (loan.loanStatus === "Granted" && !loan.isDisbursed) disburse.push(loan);
        if (loan.clearanceRecord && Object.keys(loan.clearanceRecord).length !== 0)
          clearedCases.push(loan);
        if (
          colCallRec === 0 &&
          preCallRec !== 0 &&
          (isSettledPaymentStatus(loan.paymentStatus) || hasRecordedRepayment(loan)) &&
          clearanceType !== "balance"
        ) {
          preCompletedCases.push(loan);
        }
        if (
          colCallRec !== 0 &&
          (isSettledPaymentStatus(loan.paymentStatus) || hasRecordedRepayment(loan)) &&
          clearanceType !== "balance"
        ) {
          collCompletedCases.push(loan);
        }
      });

      const [preColCases, prePaymentRec, colPaymentRec, colCases] =
        await Promise.all([
          _getPreColLoans(sortedLoans, sortedCustomers),
          _getPreColPayRecs(sortedLoans),
          _getColPayRecs(sortedLoans),
          _getColLoans(sortedLoans, sortedCustomers),
        ]);

      const assignedPreCol = preColCases.filter(
        (loan) => loan.preCollOfficer !== undefined && loan.preCollOfficer !== ""
      );

      const assignedColCases = colCases.filter(
        (loan) => loan.collofficer !== undefined && loan.collofficer !== ""
      );

      const [preRankCase, preRank, colRank, colRankCase] = await Promise.all([
        _getPreRankRecCase(preCompletedCases),
        _getPreRankRec(prePaymentRec),
        _getColRankRec(colPaymentRec),
        _getColRankRecCase(collCompletedCases),
      ]);

      const [sortedPreRank, sortedColRank, sortedPreRankCase, sortedColRankCase] =
        await Promise.all([
          _sortRank(preRank),
          _sortRank(colRank),
          _sortRankCase(preRankCase),
          _sortRankCase(colRankCase),
        ]);

      setLoans(sortedLoans);
      setCustomers(sortedCustomers);
      setAdmins(sortedAdmins);
      setStaffGroups(groupData);
      setInComingLoans(newLoans);
      setAssignedCases(assigned);
      setCompletedCases(completed);
      setDisbursed(disburse);
      setPreCollectionCases(preColCases);
      setCollectionCases(colCases);
      setAssPreColCases(assignedPreCol);
      setPreCompCases(preCompletedCases);
      setPrePayment(prePaymentRec);
      setAssColCases(assignedColCases);
      setCompColCases(collCompletedCases);
      setColPayCases(colPaymentRec);
      setClearanceRecords(publicClearRec);
      setBalClearanceRecords(balanceClearRec);
      setClearedCases(clearedCases);
      setPreRank(sortedPreRank);
      setColRank(sortedColRank);
      setPreRankCase(sortedPreRankCase);
      setColRankCase(sortedColRankCase);

      if (persist && userId) {
        sessionStorage.setItem(
          _getAdminCacheKey(userId),
          JSON.stringify({
            savedAt: Date.now(),
            data: payload,
          })
        );
      }

      socket.off("admin_on_receiver");
      socket.on("admin_on_receiver", (activeUserId) => {
        _handleAdminOn({ userId: activeUserId, sortedAdmins });
      });

      socket.off("admin_off_receiver");
      socket.on("admin_off_receiver", async (activeUserId) => {
        _handleAdminOff({ userId: activeUserId, sortedAdmins });
      });

    },
    [_getAdminCacheKey]
  );

  const _getData = async () => {
    const respon = localStorage.getItem("user");
    const ln = localStorage.getItem("loan");

    setIsLogged(true);

    const parsedData = JSON.parse(respon);
    const lnData = JSON.parse(ln);

    if (parsedData === null || parsedData === undefined) {
      setBootstrapLoading(false);
      return setIsLogged(false);
    }
    setUser(parsedData);

    if (lnData) {
      setLoan(lnData);
    }

    let hasCachedData = false;
    const cachedResponse = sessionStorage.getItem(
      _getAdminCacheKey(parsedData.userId)
    );
    if (cachedResponse) {
      try {
        const parsedCache = JSON.parse(cachedResponse);
        if (parsedCache?.data) {
          hasCachedData = true;
          await _applyFetchedData(parsedCache.data, parsedData.userId, {
            persist: false,
          });
          setBootstrapLoading(false);
        }
      } catch (error) {
        console.log(error);
      }
    }

    setGlobalLoader(!hasCachedData);
    try {
      const resp = await _fetchDataHandler(parsedData.userId);

      if (resp.success === 0) {
        if (!hasCachedData) {
          setAlerts({
            ...alerts,
            open: true,
            type: "error",
            msg: resp.message,
          });
        }

        return;
      }

      await _applyFetchedData(resp.data, parsedData.userId, { persist: true });

      socket.off("loan_request");
      socket.on("loan_request", async (data) => {
        _newArrivals(data);
      });
    } catch (error) {
      console.log(error);
      if (!hasCachedData) {
        setAlerts({
          ...alerts,
          open: true,
          type: "error",
          msg: "We could not finish loading the latest admin data. Please try again.",
        });
      }
    } finally {
      setGlobalLoader(false);
      setBootstrapLoading(false);
    }
  };

  const _handleAdminOn = async ({ userId, sortedAdmins }) => {
    let _admins = sortedAdmins;

    var admin = await _admins.find((person) => person.userId === userId);
    if (!admin) return;

    admin.isOnline = true;

    var newArr = _admins.filter((item) => item.userId !== admin.userId);

    newArr.push(admin);

    let sorted = await _sortAdmins(newArr);

    setAdmins(sorted);
  };

  const _handleAdminOff = async ({ userId, sortedAdmins }) => {
    let _admins = sortedAdmins;

    var admin = await _admins.find((person) => person.userId === userId);
    if (!admin) return;

    admin.isOnline = false;

    var newArr = _admins.filter((item) => item.userId !== admin.userId);

    newArr.push(admin);

    let sorted = await _sortAdmins(newArr);

    setAdmins(sorted);
  };

  const _newArrivals = async (data) => {
    let newIncoming = [...inComingLoans, data];
    let newLoans = [...loans, data];

    let sorted = await _sortLoans(newIncoming);
    let sortedNew = await _sortLoans(newLoans);

    setInComingLoans(sorted);
    setLoans(sortedNew);
  };

  const _handleSideTab = (field) => {
    if (field === "home") {
      setAside({
        ...aside,
        homeTab: "nav-link active",
        userTab: "nav-link",
        userNavItem: "nav-item",
        orderTab: "nav-link",
        creditTab: "nav-link",
        preColTab: "nav-link",
        colTab: "nav-link",
        dataCenterTab: "nav-link",
        sysManTab: "nav-link",
      });

      history.push("/");
      return;
    }

    if (field === "user") {
      setAside({
        ...aside,
        homeTab: "nav-link",
        userTab: "nav-link active",
        userNavItem:
          aside.userNavItem === "nav-item menu-open"
            ? "nav-item"
            : "nav-item menu-open",
        orderTab: "nav-link",
        creditTab: "nav-link",
        preColTab: "nav-link",
        colTab: "nav-link",
        dataCenterTab: "nav-link",
        sysManTab: "nav-link",
      });

      return;
    }

    if (field === "order") {
      setAside({
        ...aside,
        homeTab: "nav-link",
        userTab: "nav-link",
        orderNavItem:
          aside.orderNavItem === "nav-item menu-open"
            ? "nav-item"
            : "nav-item menu-open",
        orderTab: "nav-link active",
        creditTab: "nav-link",
        preColTab: "nav-link",
        colTab: "nav-link",
        dataCenterTab: "nav-link",
        sysManTab: "nav-link",
      });

      return;
    }

    if (field === "credit") {
      setAside({
        ...aside,
        homeTab: "nav-link",
        userTab: "nav-link",
        creditNavItem:
          aside.creditNavItem === "nav-item menu-open"
            ? "nav-item"
            : "nav-item menu-open",
        orderTab: "nav-link",
        creditTab: "nav-link active",
        preColTab: "nav-link",
        colTab: "nav-link",
        dataCenterTab: "nav-link",
        sysManTab: "nav-link",
      });

      return;
    }

    if (field === "preCol") {
      setAside({
        ...aside,
        homeTab: "nav-link",
        userTab: "nav-link",
        preColNavItem:
          aside.preColNavItem === "nav-item menu-open"
            ? "nav-item"
            : "nav-item menu-open",
        orderTab: "nav-link",
        creditTab: "nav-link",
        preColTab: "nav-link active",
        colTab: "nav-link",
        dataCenterTab: "nav-link",
        sysManTab: "nav-link",
      });

      return;
    }

    if (field === "col") {
      setAside({
        ...aside,
        homeTab: "nav-link",
        userTab: "nav-link",
        colNavItem:
          aside.colNavItem === "nav-item menu-open"
            ? "nav-item"
            : "nav-item menu-open",
        orderTab: "nav-link",
        creditTab: "nav-link",
        preColTab: "nav-link",
        colTab: "nav-link active",
        dataCenterTab: "nav-link",
        sysManTab: "nav-link",
      });

      return;
    }

    if (field === "data") {
      setAside({
        ...aside,
        homeTab: "nav-link",
        userTab: "nav-link",
        dataNavItem:
          aside.dataNavItem === "nav-item menu-open"
            ? "nav-item"
            : "nav-item menu-open",
        orderTab: "nav-link",
        creditTab: "nav-link",
        preColTab: "nav-link",
        colTab: "nav-link",
        dataCenterTab: "nav-link active",
        sysManTab: "nav-link",
      });

      return;
    }

    if (field === "sys") {
      setAside({
        ...aside,
        homeTab: "nav-link",
        userTab: "nav-link",
        sysNavItem:
          aside.sysNavItem === "nav-item menu-open"
            ? "nav-item"
            : "nav-item menu-open",
        orderTab: "nav-link",
        creditTab: "nav-link",
        preColTab: "nav-link",
        colTab: "nav-link",
        dataCenterTab: "nav-link",
        sysManTab: "nav-link active",
      });

      return;
    }
  };

  const _handleSelect = (data) => {
    if (data.field === "Loan type") {
      setSelect({
        ...select,
        loanType: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "Days") {
      setSelect({
        ...select,
        days: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "Review Staff") {
      setSelect({
        ...select,
        staff: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "Advance Staff") {
      setFilterType(data.field);

      return setSelect({
        ...select,
        advanceStaff: data.value,
      });
    }

    if (data.field === "Collection Staff") {
      setFilterType(data.field);

      return setSelect({
        ...select,
        collectionStaff: data.value,
      });
    }

    if (data.field === "Review Group")
      return setSelect({
        ...select,
        reviewGroup: data.value,
      });

    if (data.field === "Advance Group")
      return setSelect({
        ...select,
        advanceGroup: data.value,
      });

    if (data.field === "Collection Group")
      return setSelect({
        ...select,
        collectionGroup: data.value,
      });

    if (data.field === "Case Status") {
      setFilterType(data.field);

      return setSelect({
        ...select,
        caseStatus: data.value,
      });
    }
    if (data.field === "Roles*" || data.field === "Roles")
      return setSelect({
        ...select,
        role: data.value,
      });

    if (data.field === "Departments*" || data.field === "Departments") {
      setSelect({
        ...select,
        department: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "Gender*")
      return setSelect({
        ...select,
        gender: data.value,
      });

    if (data.field === "Relationship")
      return setSelect({
        ...select,
        relationship: data.value,
      });

    if (data.field === "Call result")
      return setSelect({
        ...select,
        callResult: data.value,
      });
  };

  const _handleOnChange = (data) => {
    if (data.field === "firstName")
      return setInput({
        ...inputs,
        firstName: data.value,
      });

    if (data.field === "lastName")
      return setInput({
        ...inputs,
        lastName: data.value,
      });

    if (data.field === "userName") {
      setInput({
        ...inputs,
        userName: data.value,
      });

      setFilterType(data.field);
    }

    if (data.field === "amount") {
      setInput({
        ...inputs,
        amount: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "check") {
      setInput({
        ...inputs,
        check: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "remarks") {
      setInput({
        ...inputs,
        remarks: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "image") {
      setInput({
        ...inputs,
        image: data.value,
      });

      return;
    }

    if (data.field === "loanId") {
      setInput({
        ...inputs,
        loanId: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "userId") {
      setInput({
        ...inputs,
        userId: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "phone") {
      setInput({
        ...inputs,
        phone: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "idCard") {
      setInput({
        ...inputs,
        idCard: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "customerLevel") {
      setInput({
        ...inputs,
        customerLevel: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "email")
      return setInput({
        ...inputs,
        email: data.value,
      });

    if (data.field === "password")
      return setInput({
        ...inputs,
        password: data.value,
      });

    if (data.field === "date") {
      setInput({
        ...inputs,
        date: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "ghCard") {
      setInput({
        ...inputs,
        ghCard: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "eduLevelCon3") {
      setInput({
        ...inputs,
        eduLevelCon3: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "releCon3") {
      setInput({
        ...inputs,
        releCon3: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "phoneCon3") {
      setInput({
        ...inputs,
        phoneCon3: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "nameCon3") {
      setInput({
        ...inputs,
        nameCon3: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "eduLevelCon2") {
      setInput({
        ...inputs,
        eduLevelCon2: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "releCon2") {
      setInput({
        ...inputs,
        releCon2: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "phoneCon2") {
      setInput({
        ...inputs,
        phoneCon2: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "nameCon2") {
      setInput({
        ...inputs,
        nameCon2: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "eduLevelCon1") {
      setInput({
        ...inputs,
        eduLevelCon1: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "releCon1") {
      setInput({
        ...inputs,
        releCon1: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "phoneCon1") {
      setInput({
        ...inputs,
        phoneCon1: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "nameCon1") {
      setInput({
        ...inputs,
        nameCon1: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "wkLandMark") {
      setInput({
        ...inputs,
        wkLandMark: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "wrkLocality") {
      setInput({
        ...inputs,
        wrkLocality: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "wkDAddress") {
      setInput({
        ...inputs,
        wkDAddress: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "inc") {
      setInput({
        ...inputs,
        inc: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "ind") {
      setInput({
        ...inputs,
        ind: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "wkHrs") {
      setInput({
        ...inputs,
        wkHrs: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "wCont") {
      setInput({
        ...inputs,
        wCont: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "wrkUni") {
      setInput({
        ...inputs,
        wrkUni: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "bupPh") {
      setInput({
        ...inputs,
        bupPh: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "eduLev") {
      setInput({
        ...inputs,
        eduLev: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "inSchool") {
      setInput({
        ...inputs,
        inSchool: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "resiYrs") {
      setInput({
        ...inputs,
        resiYrs: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "resiType") {
      setInput({
        ...inputs,
        resiType: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "mStatus") {
      setInput({
        ...inputs,
        mStatus: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "aLndMark") {
      setInput({
        ...inputs,
        aLndMark: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "dAddress") {
      setInput({
        ...inputs,
        dAddress: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "aor") {
      setInput({
        ...inputs,
        aor: data.value,
      });

      setFilterType(data.field);

      return;
    }

    if (data.field === "dateRange") {
      setRange(data.value);

      setFilterType(data.field);

      return;
    }

    if (data.field === "daysToFrom") {
      setInput({
        ...inputs,
        daysToFrom: data.value,
      });

      setFilterType(data.field);

      return;
    }
  };

  const _handleCreateAdmin = async (fields) => {
    if (!_hasAccess("action:user:create"))
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "You do not have permission to create staff accounts",
        open: true,
      });

    const data = {
      firstName: fields.firstName,
      lastName: fields.lastName,
      phone: fields.phone,
      password: fields.password,
      email: fields.email,
      userName: fields.userName,
      role: fields.role,
      gender: fields.gender,
      department: fields.department,
      permissions: Array.isArray(fields.permissions) ? fields.permissions : [],
      staffGroupId: fields.staffGroupId || "",
    };

    const validation = await _createAdmin(data);

    if (!validation.success)
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: validation.message,
        open: true,
      });

    setBigLoader(true);

    let response = await _createUser(data);

    if (response.success === 0) {
      setBigLoader(false);

      setAlerts({
        ...alerts,
        type: "error",
        msg: response.message,
        open: true,
      });

      return;
    }

    let newAdmins = [...admins, response.data];

    let sortedAdmins = await _sortAdmins(newAdmins);

    setAdmins(sortedAdmins);

    setBigLoader(false);

    setAlerts({
      ...alerts,
      type: "success",
      msg: response.message,
      open: true,
    });

    return true;
  };

  const _handleChangeActiveStatus = async (userId) => {
    if (!_hasAccess("action:user:toggle-active"))
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "You do not have permission to change staff active status",
        open: true,
      });

    const actionKey = `admin-active:${userId}`;
    setActionLoading(actionKey, true);

    try {
      const response = await emitWithAck(
        "changeAdminActiveStatus",
        userId,
        "Changing the user status took too long. Please refresh and try again."
      );
        const isSuccess = response.success !== false;

        if (isSuccess) {
          setAdmins((currentAdmins) =>
            _sortAdmins(
              currentAdmins.map((admin) =>
                admin.userId === userId
                  ? {
                      ...admin,
                      isActive: !admin.isActive,
                    }
                  : admin
              )
            )
          );
        }

        setAlerts({
          ...alerts,
          type: isSuccess ? "success" : "error",
          msg: response.message || "Updated successfully",
          open: true,
        });

        return isSuccess;
    } finally {
      setActionLoading(actionKey, false);
    }
  };

  const _handleEditUser = async (fields) => {
    if (!_hasAccess("action:user:update"))
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "You do not have permission to edit staff accounts",
        open: true,
      });

    const data = {
      firstName: fields.firstName,
      lastName: fields.lastName,
      phone: fields.phone,
      password: fields.password,
      email: fields.email,
      role: fields.role,
      department: fields.department,
      permissions: fields.permissions,
      staffGroupId: fields.staffGroupId || "",
    };

    if (
      data.firstName === "" &&
      data.lastName === "" &&
      data.phone === "" &&
      data.password === "" &&
      data.email === "" &&
      data.role === "" &&
      data.department === ""
    )
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "please provide at least one field value",
        open: true,
      });

    if (data.phone !== "" && data.phone.length < 10)
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "phone number is not correct",
        open: true,
      });

    if (data.phone !== "" && isNaN(data.phone))
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "phone number is not correct",
        open: true,
      });

    if (data.password !== "" && data.password.length < 6)
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "please password is too short",
        open: true,
      });

    setBigLoader(true);

    const updateData = {
      firstName:
        fields.firstName === "" ? userDetails.firstName : fields.firstName,
      lastName: fields.lastName === "" ? userDetails.lastName : fields.lastName,
      phone: fields.phone === "" ? userDetails.phone : fields.phone,
      password: fields.password.trim() === "" ? "" : fields.password,
      email: fields.email === "" ? userDetails.email : fields.email,
      role: fields.role === "" ? userDetails.role : fields.role,
      department:
        fields.department === "" ? userDetails.department : fields.department,
      staffGroupId:
        typeof fields.staffGroupId === "string"
          ? fields.staffGroupId
          : userDetails.staffGroupId || "",
      permissions: Array.isArray(fields.permissions)
        ? fields.permissions
        : userDetails.permissions || [],
      userName: userDetails.userName,
    };

    let response = await _updateUser(updateData);

    if (response.success === 0) {
      setBigLoader(false);

      setAlerts({
        ...alerts,
        type: "error",
        msg: response.message,
        open: true,
      });

      return;
    }

    let oldData = admins.find(
      (admin) => admin.userName === userDetails.userName
    );

    oldData.firstName =
      fields.firstName === "" ? userDetails.firstName : fields.firstName;
    oldData.lastName =
      fields.lastName === "" ? userDetails.lastName : fields.lastName;
    oldData.phone = fields.phone === "" ? userDetails.phone : fields.phone;
    oldData.email = fields.email === "" ? userDetails.email : fields.email;
    oldData.role = fields.role === "" ? userDetails.role : fields.role;
    oldData.department =
      fields.department === "" ? userDetails.department : fields.department;
    oldData.staffGroupId =
      typeof fields.staffGroupId === "string"
        ? fields.staffGroupId
        : userDetails.staffGroupId || "";
    oldData.staffGroupName =
      staffGroups.find((group) => group._id === oldData.staffGroupId)?.name || "";
    oldData.permissions = Array.isArray(fields.permissions)
      ? fields.permissions
      : userDetails.permissions || [];

    let filteredAdmins = admins.filter(
      (admin) => admin.userName !== userDetails.userName
    );

    let newAdmins = [...filteredAdmins, oldData];

    let sortedAdmins = await _sortAdmins(newAdmins);

    setAdmins(sortedAdmins);

    setUserDetails(oldData);

    if (oldData.userId === user.userId) {
      setUser(oldData);
      localStorage.setItem("user", JSON.stringify(oldData));
    }

    setIsEdit(false);

    setBigLoader(false);

    setAlerts({
      ...alerts,
      type: "success",
      msg: response.message,
      open: true,
    });

    return true;
  };

  const _handleDelete = async () => {
    if (!_hasAccess("action:user:delete"))
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "You do not have permission to delete staff accounts",
        open: true,
      });

    setBigLoader(true);

    socket.emit("remove_user", userDetails._id, async (response) => {
      if (response.success === 0) {
        setBigLoader(false);

        setAlerts({
          ...alerts,
          type: "error",
          msg: response.message,
          open: true,
        });

        return;
      }

      let filteredAdmins = admins.filter(
        (admin) => admin.userId !== userDetails.userId
      );

      let sortedAdmins = await _sortAdmins(filteredAdmins);

      setAdmins(sortedAdmins);

      setAlerts({
        ...alerts,
        type: "success",
        msg: response.message,
        open: true,
      });

      setIsEdit(false);

      setmodalTitle("");

      setModal(false);

      setUserDetails({});

      setBigLoader(false);
    });
  };

  const _handleCreateStaffGroup = async (fields = {}) => {
    if (!_hasAccess("action:user:create"))
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "You do not have permission to create staff groups",
        open: true,
      });

    const payload = {
      name: String(fields.name || "").trim(),
      department: String(fields.department || "").trim(),
      description: String(fields.description || "").trim(),
      createdBy: user.userName || "",
      updatedBy: user.userName || "",
    };

    if (!payload.name || !payload.department)
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "Please provide group name and department",
        open: true,
      });

    setBigLoader(true);
    const response = await _createStaffGroup(payload);
    setBigLoader(false);

    if (response.success === 0) {
      return setAlerts({
        ...alerts,
        type: "error",
        msg: response.message,
        open: true,
      });
    }

    setStaffGroups((current) =>
      [...current, response.data].sort((a, b) =>
        `${a.department}-${a.name}`.localeCompare(`${b.department}-${b.name}`)
      )
    );

    setAlerts({
      ...alerts,
      type: "success",
      msg: response.message,
      open: true,
    });

    return true;
  };

  const _handleUpdateStaffGroup = async (fields = {}) => {
    if (!_hasAccess("action:user:update"))
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "You do not have permission to update staff groups",
        open: true,
      });

    if (!fields.groupId)
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "Select a group to update",
        open: true,
      });

    setBigLoader(true);
    const response = await _updateStaffGroup({
      groupId: fields.groupId,
      name: String(fields.name || "").trim(),
      department: String(fields.department || "").trim(),
      description: String(fields.description || "").trim(),
      updatedBy: user.userName || "",
    });
    setBigLoader(false);

    if (response.success === 0) {
      return setAlerts({
        ...alerts,
        type: "error",
        msg: response.message,
        open: true,
      });
    }

    setStaffGroups((current) =>
      current
        .map((group) => (group._id === response.data._id ? response.data : group))
        .sort((a, b) => `${a.department}-${a.name}`.localeCompare(`${b.department}-${b.name}`))
    );
    setAdmins((current) =>
      current.map((admin) =>
        admin.staffGroupId === response.data._id
          ? {
              ...admin,
              department: response.data.department,
              staffGroupId: response.data._id,
              staffGroupName: response.data.name,
            }
          : admin
      )
    );
    if (userDetails.staffGroupId === response.data._id) {
      setUserDetails((current) => ({
        ...current,
        department: response.data.department,
        staffGroupId: response.data._id,
        staffGroupName: response.data.name,
      }));
    }

    setAlerts({
      ...alerts,
      type: "success",
      msg: response.message,
      open: true,
    });

    return true;
  };

  const _handleDeleteStaffGroup = async (groupId) => {
    if (!_hasAccess("action:user:delete"))
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "You do not have permission to delete staff groups",
        open: true,
      });

    if (!groupId)
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "Select a group to delete",
        open: true,
      });

    setBigLoader(true);
    const response = await _deleteStaffGroup(groupId);
    setBigLoader(false);

    if (response.success === 0) {
      return setAlerts({
        ...alerts,
        type: "error",
        msg: response.message,
        open: true,
      });
    }

    setStaffGroups((current) => current.filter((group) => group._id !== groupId));

    setAlerts({
      ...alerts,
      type: "success",
      msg: response.message,
      open: true,
    });

    return true;
  };

  const _handleAssignUsersToGroup = async ({ userIds = [], staffGroupId = "" } = {}) => {
    if (!_hasAccess("action:user:update"))
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "You do not have permission to assign users to groups",
        open: true,
      });

    const targetUsers = admins.filter((admin) => userIds.includes(admin.userId));
    const group = staffGroups.find(
      (item) => String(item._id || item.id || "") === String(staffGroupId || "")
    );

    if (!targetUsers.length || !group)
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "Select users and a valid group",
        open: true,
      });

    setBigLoader(true);

    try {
      for (const adminRecord of targetUsers) {
        const response = await _updateUser({
          userName: adminRecord.userName,
          firstName: adminRecord.firstName || "",
          lastName: adminRecord.lastName || "",
          phone: adminRecord.phone || "",
          password: "",
          email: adminRecord.email || "",
          role: adminRecord.role || "",
          department: group.department,
          permissions: Array.isArray(adminRecord.permissions)
            ? adminRecord.permissions
            : [],
          staffGroupId: String(group._id || group.id || ""),
        });

        if (response.success === 0) {
          setAlerts({
            ...alerts,
            type: "error",
            msg: response.message,
            open: true,
          });
          return false;
        }
      }

      const groupIdValue = String(group._id || group.id || "");
      const nextAdmins = admins.map((adminRecord) =>
        userIds.includes(adminRecord.userId)
          ? {
              ...adminRecord,
              department: group.department,
              staffGroupId: groupIdValue,
              staffGroupName: group.name,
            }
          : adminRecord
      );
      const sortedAdmins = await _sortAdmins(nextAdmins);
      setAdmins(sortedAdmins);

      if (userIds.includes(user.userId)) {
        const currentUser = {
          ...user,
          department: group.department,
          staffGroupId: groupIdValue,
          staffGroupName: group.name,
        };
        setUser(currentUser);
        localStorage.setItem("user", JSON.stringify(currentUser));
      }

      setAlerts({
        ...alerts,
        type: "success",
        msg: "Users assigned to group successfully",
        open: true,
      });

      return true;
    } finally {
      setBigLoader(false);
    }
  };

  const _getGroupMembers = React.useCallback(
    (department = "", roleValues = []) => {
      const departmentGroups = getGroupsByDepartment(staffGroups, department);
      const allowedRoles = new Set(Array.isArray(roleValues) ? roleValues : []);

      return departmentGroups.map((group) => ({
        ...group,
        members: admins.filter(
          (admin) =>
            String(admin?.staffGroupId || "") === String(group.id || group._id || "") &&
            (!allowedRoles.size || allowedRoles.has(admin.role))
        ),
      }));
    },
    [admins, staffGroups]
  );

  const _logout = async () => {
    socket.emit("admin_off", {
      userId: user.userId,
      status: false,
      date: new Date(),
    });

    localStorage.removeItem("user");

    setIsLogged(false);

    _routeToPage("");
  };

  const _handleSearchUsers = async () => {
    if (
      inputs.userName === "" &&
      inputs.phone === "" &&
      inputs.date === "" &&
      select.department === ""
    )
      return setAlerts({
        ...alerts,
        type: "info",
        msg: "please provide a search parameter",
        open: true,
      });

    setGlobalLoader(true);

    let filterData = {
      type: filterType,
      filterArray: [
        inputs.userName,
        inputs.phone,
        inputs.date,
        select.department,
      ],
    };

    let dataToFilter = admins;

    setOriginalData(admins);

    let response = await _filterUser({ filterData, dataToFilter });

    let sortedAdmins = await _sortAdmins(response);

    setAdmins(sortedAdmins);

    setGlobalLoader(false);
  };

  const _handleSearchCustomers = async () => {
    if (inputs.userId === "" && inputs.phone === "" && inputs.date === "")
      return setAlerts({
        ...alerts,
        type: "info",
        msg: "please provide a search parameter",
        open: true,
      });

    setGlobalLoader(true);

    let filterData = {
      type: filterType,
      filterArray: [inputs.userId, inputs.phone, inputs.date],
    };

    let dataToFilter = customers;

    setOriginalData(customers);

    let response = await _filterUser({ filterData, dataToFilter });

    let sorted = await _sortCustomers(response);

    setCustomers(sorted);

    setGlobalLoader(false);
  };

  const _resetSearchParams = async (from) => {
    if (originalData.length === 0) return null;

    if (from === "admins") {
      setAdmins(originalData);
    }

    if (from === "customers") {
      setCustomers(originalData);
    }

    setInput({
      ...inputs,
      userName: "",
      phone: "",
      date: "",
      userId: "",
    });

    setSelect({
      ...select,
      department: "",
    });

    setFilterType("");

    setOriginalData([]);
  };

  const _handleCustomerActiveStatus = async (userId) => {
    socket.emit("changeCustomerActiveStatus", userId, (response) => {
      setCustomers((current) =>
        current.map((item) =>
          item.userId === userId ? { ...item, isActive: !item.isActive } : item
        )
      );
      setCustomer((current) =>
        current?.userId === userId
          ? {
              ...current,
              isActive: !current.isActive,
            }
          : current
      );

      return setAlerts({
        ...alerts,
        type: "info",
        msg: response.message,
        open: true,
      });
    });
  };

  const _handleFindCustomer = async () => {
    if (inputs.userId === "" && inputs.phone === "" && inputs.idCard === "")
      return setAlerts({
        ...alerts,
        type: "info",
        msg: "please provide a search parameter",
        open: true,
      });

    let filterData = {
      type: filterType,
      filterArray: [inputs.userId, inputs.phone, inputs.idCard],
    };

    let dataToFilter = customers;

    let response = await _findCustomer({ filterData, dataToFilter });

    if (
      response === null ||
      response === undefined ||
      Object.keys(response).length === 0
    )
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "No record found",
        open: true,
      });

    await _loadCustomerDetails(response);
  };

  const _clearCustomerSearch = () => {
    if (Object.keys(customer).length === 0) return null;

    customerDetailsRequestRef.current += 1;
    setCustomerProfileLoading(false);

    setInput({
      ...inputs,
      userId: "",
      phone: "",
      idCard: "",
      ghCard: "",
      idFrontImage: null,
      idBackImage: null,
      livePhotoImage: null,
    });

    setCustomer({});
  };

  const _handleEditCustomer = async () => {
    setIsEdit(false);
    setGlobalLoader(true);

    let structuredData = await _structureData({ inputs, customer });

    socket.emit("updateCustomer", structuredData, async (response) => {
      if (response.success === true) {
        let updatedCustomer = {
          ...customer,
          level: structuredData.level,
          IDinfo: structuredData.IDinfo,
          pesonalInfo: structuredData.pesonalInfo,
          workInfo: structuredData.workInfo,
          emergncyContacts: structuredData.emergncyContacts,
        };

        if (inputs.idFrontImage || inputs.idBackImage || inputs.livePhotoImage) {
          const formData = new FormData();

          if (inputs.idFrontImage) {
            formData.append("idFrontImage", inputs.idFrontImage);
          }
          if (inputs.idBackImage) {
            formData.append("idBackImage", inputs.idBackImage);
          }
          if (inputs.livePhotoImage) {
            formData.append("livePhotoImage", inputs.livePhotoImage);
          }
          formData.append("gCardNumber", structuredData.IDinfo.gCardNumber || "");

          const identityResponse = await _updateIDCard({
            formData,
            userId: customer.userId,
          });

          if (identityResponse.success === 0) {
            setAlerts({
              ...alerts,
              type: "error",
              msg: identityResponse.message,
              open: true,
            });
            setGlobalLoader(false);
            return;
          }

          updatedCustomer = identityResponse.data || updatedCustomer;
        }

        let newCustomers = customers.filter((item) => item.userId !== customer.userId);

        newCustomers.push(_toCustomerSummary(updatedCustomer));

        let sorted = await _sortCustomers(newCustomers);

        setCustomers(sorted);

        setCustomer(updatedCustomer);
        setInput({
          ...inputs,
          ghCard: "",
          idFrontImage: null,
          idBackImage: null,
          livePhotoImage: null,
        });

        setAlerts({
          ...alerts,
          type: "success",
          msg: response.message,
          open: true,
        });

        setGlobalLoader(false);

        return;
      }

      if (response.success === false) {
        setAlerts({
          ...alerts,
          type: "error",
          msg: response.message,
          open: true,
        });

        setGlobalLoader(false);

        return;
      }
    });
  };

  const _handleFindLoan = async () => {
    if (
      inputs.userId === "" &&
      inputs.loanId === "" &&
      dateRange === null &&
      select.loanType === ""
    )
      return setAlerts({
        ...alerts,
        type: "info",
        msg: "please provide a search parameter",
        open: true,
      });

    let filterData = {
      type: filterType,
      filterArray: [inputs.userId, inputs.loanId, dateRange, select.loanType],
    };

    let dataToFilter = inComingLoans;

    setGlobalLoader(true);

    let response = await _filterCases({ filterData, dataToFilter, customers });

    if (response === null || response === undefined) {
      setAlerts({
        ...alerts,
        type: "warning",
        msg: "No record found",
        open: true,
      });

      setGlobalLoader(false);
      return;
    }

    setOriginalData(inComingLoans);

    let sorted = await _sortLoans(response);

    setInComingLoans(sorted);

    setGlobalLoader(false);
  };

  const _clearLoanSearch = () => {
    if (originalData.length === 0) return null;

    setInput({
      ...inputs,
      userId: "",
      loanId: "",
    });

    setRange(null);

    setSelect({
      ...select,
      loanType: "",
    });

    setInComingLoans(originalData);

    setOriginalData([]);
  };

  const _handleFindAssignedLoan = async () => {
    if (
      inputs.userId === "" &&
      inputs.loanId === "" &&
      inputs.phone === "" &&
      dateRange === null &&
      select.staff === ""
    )
      return setAlerts({
        ...alerts,
        type: "info",
        msg: "please provide a search parameter",
        open: true,
      });

    let filterData = {
      type: filterType,
      filterArray: [
        inputs.userId,
        inputs.loanId,
        dateRange,
        select.staff,
        inputs.phone,
      ],
    };

    let dataToFilter = assignedCases;

    setGlobalLoader(true);

    let response = await _filterAssignedCases({
      filterData,
      dataToFilter,
      customers,
    });

    if (response === null || response === undefined) {
      setAlerts({
        ...alerts,
        type: "warning",
        msg: "No record found",
        open: true,
      });

      setGlobalLoader(false);
      return;
    }

    setOriginalData(assignedCases);

    let sorted = await _sortLoans(response);

    setAssignedCases(sorted);

    setGlobalLoader(false);
  };

  const _handleFindCompletedLoan = async () => {
    if (
      inputs.userId === "" &&
      inputs.loanId === "" &&
      inputs.phone === "" &&
      dateRange === null &&
      select.staff === ""
    )
      return setAlerts({
        ...alerts,
        type: "info",
        msg: "please provide a search parameter",
        open: true,
      });

    let filterData = {
      type: filterType,
      filterArray: [
        inputs.userId,
        inputs.loanId,
        dateRange,
        select.staff,
        inputs.phone,
      ],
    };

    let dataToFilter = completedCases;

    setGlobalLoader(true);

    let response = await _filterAssignedCases({
      filterData,
      dataToFilter,
      customers,
    });

    if (response === null || response === undefined) {
      setAlerts({
        ...alerts,
        type: "warning",
        msg: "No record found",
        open: true,
      });

      setGlobalLoader(false);
      return;
    }

    setOriginalData(completedCases);

    let sorted = await _sortLoans(response);

    setCompletedCases(sorted);

    setGlobalLoader(false);
  };

  const _clearAssignedLoanSearch = () => {
    if (originalData.length === 0) return null;

    setInput({
      ...inputs,
      userId: "",
      loanId: "",
      phone: "",
    });

    setRange(null);

    setSelect({
      ...select,
      staff: "",
    });

    setAssignedCases(originalData);

    setOriginalData([]);
  };

  const _clearCompletedLoanSearch = () => {
    if (originalData.length === 0) return null;

    setInput({
      ...inputs,
      userId: "",
      loanId: "",
      phone: "",
    });

    setRange(null);

    setSelect({
      ...select,
      staff: "",
    });

    setCompletedCases(originalData);

    setOriginalData([]);
  };

  const _handleAssignCase = async (personnel) => {
    if (!_hasAccess("action:credit:assign"))
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "You do not have permission to assign credit cases",
        open: true,
      });

    const personnelList = Array.isArray(personnel) ? personnel : [personnel];

    if (personnelList.length === 0) return false;

    const actionKey = "credit-assign";
    setActionLoading(actionKey, true);
    try {
      const selectedIdSet = new Set(selectedCases);
      const selectedLoanMap = new Map(
        inComingLoans
          .filter((loan) => selectedIdSet.has(loan.ID))
          .map((loan) => [loan.ID, loan])
      );
      const orderedSelectedLoans = selectedCases
        .map((caseId) => selectedLoanMap.get(caseId))
        .filter(Boolean);
      const casesSelected = orderedSelectedLoans.map((loan) => [loan]);
      const assignedLoanMap = new Map(
        orderedSelectedLoans.map((loan, index) => [
          loan.ID,
          {
            ...loan,
            rvOfName: personnelList[index % personnelList.length].userName,
          },
        ])
      );

      const response = await emitWithAck(
        "assignTask",
        { personnelList, casesSelected },
        "Assigning cases took too long. The server may still finish the task, so refresh to confirm the latest state."
      );

      if (response.success === true) {
        setAlerts({
          ...alerts,
          type: "success",
          msg: response.message,
          open: true,
        });

        const nextIncomingLoans = await _sortLoans(
          inComingLoans.filter((loan) => !selectedIdSet.has(loan.ID))
        );
        const nextAssignedCases = await _sortLoans([
          ...assignedCases.filter((loan) => !selectedIdSet.has(loan.ID)),
          ...selectedCases
            .map((caseId) => assignedLoanMap.get(caseId))
            .filter(Boolean),
        ]);
        const nextLoans = await _sortLoans(
          loans.map((loan) => assignedLoanMap.get(loan.ID) || loan)
        );

        setInComingLoans(nextIncomingLoans);
        setAssignedCases(nextAssignedCases);
        setLoans(nextLoans);

        setmodalTitle("");
        setAssignModal(false);
        setSelectedCases([]);

        return true;
      }

      setAlerts({
        ...alerts,
        type: "error",
        msg: response.message || "Assigning cases failed.",
        open: true,
      });

      return false;
    } finally {
      setActionLoading(actionKey, false);
    }
  };

  const _handleReAssignCase = async (data) => {
    if (!_hasAccess("action:credit:reassign"))
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "You do not have permission to reassign credit cases",
        open: true,
      });

    const personnelList = Array.isArray(data) ? data : [data];

    if (personnelList.length === 0) {
      return false;
    }

    const actionKey = "credit-reassign";
    setActionLoading(actionKey, true);
    try {
      const selectedIdSet = new Set(selectedCases);
      const selectedLoanMap = new Map(
        assignedCases
          .filter((loan) => selectedIdSet.has(loan.ID))
          .map((loan) => [loan.ID, loan])
      );
      const orderedSelectedLoans = selectedCases
        .map((caseId) => selectedLoanMap.get(caseId))
        .filter(Boolean);
      const casesSelected = orderedSelectedLoans.map((loan) => [loan]);
      const assignedLoanMap = new Map(
        orderedSelectedLoans.map((loan, index) => [
          loan.ID,
          {
            ...loan,
            rvOfName: personnelList[index % personnelList.length].userName,
          },
        ])
      );

      const response = await emitWithAck(
        "re_assignTask",
        { personnelList, casesSelected },
        "Reassigning cases took too long. The server may still finish the task, so refresh to confirm the latest state."
      );

      if (response.success === true) {
        setmodalTitle("");
        setAssignModal(false);
        setSelectedCases([]);

        const nextAssignedCases = await _sortLoans(
          assignedCases.map((loan) => assignedLoanMap.get(loan.ID) || loan)
        );
        const nextLoans = await _sortLoans(
          loans.map((loan) => assignedLoanMap.get(loan.ID) || loan)
        );

        setAssignedCases(nextAssignedCases);
        setLoans(nextLoans);

        setAlerts({
          ...alerts,
          type: "success",
          msg: response.message,
          open: true,
        });

        return true;
      }

      setAlerts({
        ...alerts,
        type: "error",
        msg: response.message || "Reassigning cases failed.",
        open: true,
      });

      return false;
    } finally {
      setActionLoading(actionKey, false);
    }
  };

  const _handleLoanStatus = async (data) => {
    if (data.loanState === "")
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "Please select audit status",
        open: true,
      });

    if (data.loanState === "granted" && !_hasAccess("action:loan:approve"))
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "You do not have permission to approve loans",
        open: true,
      });

    if (data.loanState === "rejected" && !_hasAccess("action:loan:reject"))
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "You do not have permission to reject loans",
        open: true,
      });

    if (data.rvOfCom === "")
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "Please pass a review comment",
        open: true,
      });

    setGlobalLoader(true);

    if (data.loanState === "granted") {
      let resp = await _handleGrantLoan({
        reviewOficer: user.userName,
        comment: data.rvOfCom,
        ID: data.loan.ID,
      });

      if (resp.success === 0) {
        setAlerts({
          ...alerts,
          type: "error",
          msg: resp.message,
          open: true,
        });

        setGlobalLoader(false);

        return;
      }

      await _getData();

      _routeToPage("credit-case-list");

      setGlobalLoader(false);

      setAlerts({
        ...alerts,
        type: "success",
        msg: resp.message,
        open: true,
      });

      return;
    }

    if (data.loanState === "rejected") {
      let resp = await _handleRejectLoan({
        reviewOficer: user.userName,
        comment: data.rvOfCom,
        ID: data.loan.ID,
      });

      if (resp.success === 0) {
        setGlobalLoader(false);

        setAlerts({
          ...alerts,
          type: "error",
          msg: resp.message,
          open: true,
        });

        return;
      }

      await _getData();

      _routeToPage("credit-case-list");

      setGlobalLoader(false);

      setAlerts({
        ...alerts,
        type: "success",
        msg: resp.message,
        open: true,
      });

      return;
    }
  };

  const _handleAddCallRecord = async (data) => {
    if (
      data.phone === "" ||
      data.comment === "" ||
      select.relationship === "" ||
      select.callResult === ""
    )
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "all fields are required",
        open: true,
      });

    setBigLoader(true);

    if (data.title === undefined || data.title === "") {
      let resp = await _createCallRecord({
        calledNumber: data.phone,
        relation: select.relationship,
        callResult: select.callResult,
        callDate: new Date(),
        auditOfficer: user.userName,
        remarks: data.comment,
        ID: loan.ID,
      });

      if (resp.success === 0) {
        setBigLoader(false);

        setAlerts({
          ...alerts,
          type: "error",
          msg: resp.message,
          open: true,
        });

        return;
      }

      let rec = {
        calledNumber: data.phone,
        relation: select.relationship,
        callResult: select.callResult,
        callDate: new Date(),
        auditOfficer: user.userName,
        remarks: data.comment,
      };

      loan.auditCallRecords.push(rec);

      localStorage.setItem("loan", JSON.stringify(loan));

      await _getData();

      setSelect({
        ...select,
        relationship: "",
        callResult: "",
      });

      setBigLoader(false);

      setmodalTitle("");
      setCallRecordsModal(false);

      setAlerts({
        ...alerts,
        type: "success",
        msg: resp.message,
        open: true,
      });
    }

    if (data.title === "precol") {
      let resp = await _createPreCollCallRecord({
        calledNumber: data.phone,
        relation: select.relationship,
        callResult: select.callResult,
        callDate: new Date(),
        preCollOfficer: user.userName,
        remarks: data.comment,
        ID: loan.ID,
      });

      if (resp.success === 0) {
        setBigLoader(false);

        setAlerts({
          ...alerts,
          type: "error",
          msg: resp.message,
          open: true,
        });

        return;
      }

      let rec = {
        calledNumber: data.phone,
        relation: select.relationship,
        callResult: select.callResult,
        callDate: new Date(),
        preCollOfficer: user.userName,
        remarks: data.comment,
      };

      loan.preCollCallRecords.push(rec);

      localStorage.setItem("loan", JSON.stringify(loan));

      await _getData();

      setSelect({
        ...select,
        relationship: "",
        callResult: "",
      });

      setBigLoader(false);

      setmodalTitle("");
      setCallRecordsModal(false);

      setAlerts({
        ...alerts,
        type: "success",
        msg: resp.message,
        open: true,
      });
    }

    if (data.title === "col") {
      let resp = await _createCollCallRecord({
        calledNumber: data.phone,
        relation: select.relationship,
        callResult: select.callResult,
        callDate: new Date(),
        collOfficer: user.userName,
        remarks: data.comment,
        ID: loan.ID,
      });

      if (resp.success === 0) {
        setBigLoader(false);

        setAlerts({
          ...alerts,
          type: "error",
          msg: resp.message,
          open: true,
        });

        return;
      }

      let rec = {
        calledNumber: data.phone,
        relation: select.relationship,
        callResult: select.callResult,
        callDate: new Date(),
        collOfficer: user.userName,
        remarks: data.comment,
      };

      loan.collCallRecords.push(rec);

      localStorage.setItem("loan", JSON.stringify(loan));

      await _getData();

      setSelect({
        ...select,
        relationship: "",
        callResult: "",
      });

      setBigLoader(false);

      setmodalTitle("");
      setCallRecordsModal(false);

      setAlerts({
        ...alerts,
        type: "success",
        msg: resp.message,
        open: true,
      });
    }
  };

  const handleClearDisbursed = async () => {
    if (!_hasAccess("action:disbursement:manual"))
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "You do not have permission to run manual disbursement",
        open: true,
      });

    setGlobalLoader(true);

    socket.emit("disburse_loans", selectedCases, async (response) => {
      const failedItems =
        response.data === undefined
          ? []
          : response.data.filter((item) => item.success === false);

      if (response.success === true) {
        await _getData();

        setGlobalLoader(false);

        setAlerts({
          ...alerts,
          type: "success",
          msg: response.message,
          open: true,
        });
      }

      if (response.success === false) {
        await _getData();

        setGlobalLoader(false);

        setAlerts({
          ...alerts,
          type: "error",
          msg:
            failedItems.length === 0
              ? response.message
              : `${response.message}. Failed: ${failedItems
                  .map((item) => item.loanId)
                  .join(", ")}`,
          open: true,
        });
      }
    });
  };

  const handleMarkManualDisbursed = async (loanIds = selectedCases) => {
    if (!_hasAccess("action:disbursement:manual"))
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "You do not have permission to confirm manual disbursement",
        open: true,
      });

    if (!Array.isArray(loanIds) || loanIds.length === 0)
      return setAlerts({
        ...alerts,
        type: "info",
        msg: "Select at least one approved case to mark as disbursed",
        open: true,
      });

    setGlobalLoader(true);

    const response = await _markManualDisbursement(loanIds);

    await _getData();
    setSelectedCases([]);
    setGlobalLoader(false);

    setAlerts({
      ...alerts,
      type: response.success === 1 ? "success" : "error",
      msg: response.message,
      open: true,
    });

    return response;
  };

  const _retryFailedDisbursement = async ({ loanId, channel }) => {
    if (!_hasAccess("action:disbursement:retry"))
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "You do not have permission to retry failed disbursements",
        open: true,
      });

    setGlobalLoader(true);

    const response = await _retryDisbursement({ loanId, channel });

    await _getData();

    setGlobalLoader(false);

    setAlerts({
      ...alerts,
      type: response.success === 1 ? "success" : "error",
      msg: response.message,
      open: true,
    });

    return response;
  };

  const _handleSeachDis = async () => {
    setGlobalLoader(true);

    setOriginalData(disbursed);

    let res = await _filterDis({ date: dateRange, dataToFilter: disbursed });
    setDisbursed(res);

    setGlobalLoader(false);
  };

  const _handleClearSearch = () => {
    setDisbursed(originalData);
    setOriginalData([]);
    setRange(null);
  };

  const _handleOrderlistDetails = async (row) => {
    localStorage.setItem("loan", JSON.stringify(row));
    setLoan(row);

    let tda = new Date();

    let loanDate = new Date(row.dop);

    let timeDiff = loanDate.getTime() - tda.getTime();

    let diffDate = timeDiff / (1000 * 3600 * 24);

    let dur = parseInt(diffDate);

    let actDur = dur === -0 ? -1 : dur;

    if (
      row.loanStatus === "Review" ||
      row.loanStatus === "Rejected" ||
      actDur > 2
    )
      return _routeToPage("/loan-details");

    if (0 <= actDur && actDur <= 2) return _routeToPage("/pre-loan-details");

    if (actDur < 0) return _routeToPage("/collection-loan-details");
  };

  const _handleDateSearch = async () => {
    let resp = await _findByDate({
      date: dateRange,
      completed: completedCases,
      assigned: assignedCases,
    });

    setOriginalData([completedCases, assignedCases]);

    setCompletedCases(resp[0]);
    setAssignedCases(resp[1]);
  };

  const _clearDateSearch = () => {
    if (originalData.length === 0) return null;

    setCompletedCases(originalData[0]);
    setAssignedCases(originalData[1]);

    setOriginalData([]);
    setRange(null);
  };

  const _handlePreAssignCase = async (personnel) => {
    if (!_hasAccess("action:precollection:assign"))
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "You do not have permission to assign pre-collection cases",
        open: true,
      });

    const personnelList = Array.isArray(personnel) ? personnel : [personnel];

    if (personnelList.length === 0) return false;

    const actionKey = "precollection-assign";
    setActionLoading(actionKey, true);
    try {
      const selectedIdSet = new Set(selectedCases);
      const selectedLoanMap = new Map(
        preCollectionCases
          .filter((loan) => selectedIdSet.has(loan.ID))
          .map((loan) => [loan.ID, loan])
      );
      const orderedSelectedLoans = selectedCases
        .map((caseId) => selectedLoanMap.get(caseId))
        .filter(Boolean);
      const casesSelected = orderedSelectedLoans.map((loan) => [loan]);

      const assignedLoanMap = new Map(
        orderedSelectedLoans.map((loan, index) => [
          loan.ID,
          {
            ...loan,
            preCollOfficer: personnelList[index % personnelList.length].userName,
          },
        ])
      );

      const response = await emitWithAck(
        "assignPreTask",
        { personnelList, casesSelected },
        "Assigning pre-collection cases took too long. Refresh to confirm the latest state."
      );

      if (response.success === true) {
        const nextUnassignedCases = preCollectionCases.filter(
          (loan) => !selectedIdSet.has(loan.ID)
        );
        const nextAssignedCases = [
          ...assignedPreColCases.filter((loan) => !selectedIdSet.has(loan.ID)),
          ...selectedCases
            .map((caseId) => assignedLoanMap.get(caseId))
            .filter(Boolean),
        ];

        setPreCollectionCases(nextUnassignedCases);
        setAssPreColCases(nextAssignedCases);

        setAlerts({
          ...alerts,
          type: "success",
          msg: response.message,
          open: true,
        });

        setmodalTitle("");
        setSelectedCases([]);

        return true;
      }

      setAlerts({
        ...alerts,
        type: "error",
        msg: response.message || "Assigning pre-collection cases failed.",
        open: true,
      });

      return false;
    } finally {
      setActionLoading(actionKey, false);
    }
  };

  const _handleReAssignPreCase = async (data) => {
    if (!_hasAccess("action:precollection:assign"))
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "You do not have permission to reassign pre-collection cases",
        open: true,
      });

    let casesSelected = [];

    const actionKey = "precollection-reassign";
    setActionLoading(actionKey, true);
    try {
      const personnelList = Array.isArray(data) ? data : [data];

      if (personnelList.length === 0) {
        return false;
      }

      selectedCases.forEach((caseId) => {
        let loanCase = assignedPreColCases.filter((loan) => loan.ID === caseId);
        if (loanCase) casesSelected.push(loanCase);
      });

      const response = await emitWithAck(
        "re_assignPreTask",
        { personnelList, casesSelected },
        "Reassigning pre-collection cases took too long. Refresh to confirm the latest state."
      );

      if (response.success === true) {
        setmodalTitle("");
        setSelectedCases([]);

        await _getData();

        setAlerts({
          ...alerts,
          type: "success",
          msg: response.message,
          open: true,
        });

        return true;
      }

      setAlerts({
        ...alerts,
        type: "error",
        msg: response.message || "Reassigning pre-collection cases failed.",
        open: true,
      });

      return false;
    } finally {
      setActionLoading(actionKey, false);
    }
  };

  const _handleFindPreLoan = async () => {
    if (
      inputs.userId === "" &&
      inputs.loanId === "" &&
      dateRange === null &&
      select.loanType === "" &&
      select.days === ""
    )
      return setAlerts({
        ...alerts,
        type: "info",
        msg: "please provide a search parameter",
        open: true,
      });

    let filterData = {
      type: filterType,
      filterArray: [
        inputs.userId,
        inputs.loanId,
        dateRange,
        select.loanType,
        select.days,
      ],
    };

    let dataToFilter = preCollectionCases;

    setGlobalLoader(true);

    let response = await _filterPreCases({
      filterData,
      dataToFilter,
      customers,
    });

    if (response === null || response === undefined) {
      setAlerts({
        ...alerts,
        type: "warning",
        msg: "No record found",
        open: true,
      });

      setGlobalLoader(false);
      return;
    }

    setOriginalData(preCollectionCases);

    let sorted = await _sortLoans(response);

    setPreCollectionCases(sorted);

    setGlobalLoader(false);
  };

  const _clearPreLoanSearch = () => {
    if (originalData.length === 0) return null;

    setInput({
      ...inputs,
      userId: "",
      loanId: "",
    });

    setRange(null);

    setSelect({
      ...select,
      loanType: "",
      days: "",
    });

    setPreCollectionCases(originalData);

    setOriginalData([]);
  };

  const _handleFindAssPreLoan = async () => {
    if (
      inputs.userId === "" &&
      inputs.loanId === "" &&
      dateRange === null &&
      select.loanType === "" &&
      select.days === "" &&
      select.advanceStaff === "" &&
      select.caseStatus === ""
    )
      return setAlerts({
        ...alerts,
        type: "info",
        msg: "please provide a search parameter",
        open: true,
      });

    let filterData = {
      type: filterType,
      filterArray: [
        inputs.userId,
        inputs.loanId,
        dateRange,
        select.loanType,
        select.days,
        select.advanceStaff,
        select.caseStatus,
      ],
    };

    let dataToFilter = assignedPreColCases;

    setGlobalLoader(true);

    let response = await _filterAssPreCases({
      filterData,
      dataToFilter,
      customers,
    });

    if (response === null || response === undefined) {
      setAlerts({
        ...alerts,
        type: "warning",
        msg: "No record found",
        open: true,
      });

      setGlobalLoader(false);
      return;
    }

    setOriginalData(assignedPreColCases);

    let sorted = await _sortLoans(response);

    setAssPreColCases(sorted);

    setGlobalLoader(false);
  };

  const _clearAssPreLoanSearch = () => {
    if (originalData.length === 0) return null;

    setInput({
      ...inputs,
      userId: "",
      loanId: "",
    });

    setRange(null);

    setSelect({
      ...select,
      loanType: "",
      days: "",
      advanceStaff: "",
      caseStatus: "",
    });

    setAssPreColCases(originalData);

    setOriginalData([]);
  };

  const _handleFindCompPreLoan = async () => {
    if (
      inputs.userId === "" &&
      inputs.loanId === "" &&
      dateRange === null &&
      select.loanType === "" &&
      select.days === "" &&
      select.advanceStaff === "" &&
      inputs.phone === ""
    )
      return setAlerts({
        ...alerts,
        type: "info",
        msg: "please provide a search parameter",
        open: true,
      });

    let filterData = {
      type: filterType,
      filterArray: [
        inputs.userId,
        inputs.loanId,
        dateRange,
        select.loanType,
        select.days,
        select.advanceStaff,
        inputs.phone,
      ],
    };

    let dataToFilter = preCompCases;

    setGlobalLoader(true);

    let response = await _filterPreCompCases({
      filterData,
      dataToFilter,
      customers,
    });

    if (response === null || response === undefined) {
      setAlerts({
        ...alerts,
        type: "warning",
        msg: "No record found",
        open: true,
      });

      setGlobalLoader(false);
      return;
    }

    setOriginalData(preCompCases);

    let sorted = await _sortLoans(response);

    setPreCompCases(sorted);

    setGlobalLoader(false);
  };

  const _clearPreCompLoanSearch = () => {
    if (originalData.length === 0) return null;

    setInput({
      ...inputs,
      userId: "",
      loanId: "",
      phone: "",
    });

    setRange(null);

    setSelect({
      ...select,
      loanType: "",
      days: "",
      advanceStaff: "",
    });

    setPreCompCases(originalData);

    setOriginalData([]);
  };

  const _handleFindPrePayRec = async () => {
    if (
      inputs.userId === "" &&
      inputs.loanId === "" &&
      dateRange === null &&
      select.advanceStaff === "" &&
      inputs.phone === ""
    )
      return setAlerts({
        ...alerts,
        type: "info",
        msg: "please provide a search parameter",
        open: true,
      });

    let filterData = {
      type: filterType,
      filterArray: [
        inputs.userId,
        inputs.loanId,
        dateRange,
        select.advanceStaff,
        inputs.phone,
      ],
    };

    let dataToFilter = prePayment;

    setGlobalLoader(true);

    let response = await _filterPrePayRec({
      filterData,
      dataToFilter,
      customers,
    });

    if (response === null || response === undefined) {
      setAlerts({
        ...alerts,
        type: "warning",
        msg: "No record found",
        open: true,
      });

      setGlobalLoader(false);
      return;
    }

    setOriginalData(prePayment);

    let sorted = await _sortLoans(response);

    setPrePayment(sorted);

    setGlobalLoader(false);
  };

  const _clearPrePayRec = () => {
    if (originalData.length === 0) return null;

    setInput({
      ...inputs,
      userId: "",
      loanId: "",
      phone: "",
    });

    setRange(null);

    setSelect({
      ...select,
      advanceStaff: "",
    });

    setPrePayment(originalData);

    setOriginalData([]);
  };

  const _handleFindCompLoan = async () => {
    if (
      inputs.userId === "" &&
      inputs.loanId === "" &&
      dateRange === null &&
      select.loanType === "" &&
      inputs.daysToFrom === "" &&
      inputs.phone === ""
    )
      return setAlerts({
        ...alerts,
        type: "info",
        msg: "please provide a search parameter",
        open: true,
      });

    let filterData = {
      type: filterType,
      filterArray: [
        inputs.userId,
        inputs.loanId,
        dateRange,
        select.loanType,
        inputs.phone,
        inputs.daysToFrom,
      ],
    };

    let dataToFilter = collectionCases;

    setGlobalLoader(true);

    let response = await _filterColCases({
      filterData,
      dataToFilter,
      customers,
    });

    if (response === null || response === undefined) {
      setAlerts({
        ...alerts,
        type: "warning",
        msg: "No record found",
        open: true,
      });

      setGlobalLoader(false);
      return;
    }

    if (originalData.length === 0) {
      setOriginalData(collectionCases);
    }

    if (originalData.length !== 0) {
      setOriginalData2(collectionCases);
    }

    let sorted = await _sortLoans(response);

    setCollectionCases(sorted);

    setGlobalLoader(false);
  };

  const _clearColCases = () => {
    if (originalData.length === 0) return null;

    setInput({
      ...inputs,
      userId: "",
      loanId: "",
      phone: "",
      daysToFrom: "",
    });

    setRange(null);

    setSelect({
      ...select,
      loanType: "",
    });

    setCollectionCases(originalData);

    setOriginalData2([]);

    setOriginalData([]);
  };

  const _handleColAssignCase = async (personnel) => {
    if (!_hasAccess("action:collection:assign"))
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "You do not have permission to assign collection cases",
        open: true,
      });

    const personnelList = Array.isArray(personnel) ? personnel : [personnel];

    if (personnelList.length === 0) return false;

    const actionKey = "collection-assign";
    setActionLoading(actionKey, true);
    try {
      const selectedIdSet = new Set(selectedCases);
      const selectedLoanMap = new Map(
        collectionCases
          .filter((loan) => selectedIdSet.has(loan.ID))
          .map((loan) => [loan.ID, loan])
      );
      const orderedSelectedLoans = selectedCases
        .map((caseId) => selectedLoanMap.get(caseId))
        .filter(Boolean);
      const casesSelected = orderedSelectedLoans.map((loan) => [loan]);

      const assignedLoanMap = new Map(
        orderedSelectedLoans.map((loan, index) => [
          loan.ID,
          {
            ...loan,
            collofficer: personnelList[index % personnelList.length].userName,
          },
        ])
      );

      const response = await emitWithAck(
        "assignColTask",
        { personnelList, casesSelected },
        "Assigning collection cases took too long. Refresh to confirm the latest state."
      );

      if (response.success === true) {
        const nextUnassignedCases = collectionCases.filter(
          (loan) => !selectedIdSet.has(loan.ID)
        );
        const nextAssignedCases = [
          ...assignedColCases.filter((loan) => !selectedIdSet.has(loan.ID)),
          ...selectedCases
            .map((caseId) => assignedLoanMap.get(caseId))
            .filter(Boolean),
        ];

        setCollectionCases(nextUnassignedCases);
        setAssColCases(nextAssignedCases);

        setAlerts({
          ...alerts,
          type: "success",
          msg: response.message,
          open: true,
        });

        setmodalTitle("");
        setSelectedCases([]);

        await _getData();

        return true;
      }

      setAlerts({
        ...alerts,
        type: "error",
        msg: response.message || "Assigning collection cases failed.",
        open: true,
      });

      return false;
    } finally {
      setActionLoading(actionKey, false);
    }
  };

  const _handleReAssignColCase = async (data) => {
    if (!_hasAccess("action:collection:assign"))
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "You do not have permission to reassign collection cases",
        open: true,
      });

    let casesSelected = [];

    const actionKey = "collection-reassign";
    setActionLoading(actionKey, true);
    try {
      const personnelList = Array.isArray(data) ? data : [data];

      if (personnelList.length === 0) {
        return false;
      }

      selectedCases.forEach((caseId) => {
        let loanCase = assignedColCases.filter((loan) => loan.ID === caseId);
        if (loanCase) casesSelected.push(loanCase);
      });

      const response = await emitWithAck(
        "reAssignColTask",
        { personnelList, casesSelected },
        "Reassigning collection cases took too long. Refresh to confirm the latest state."
      );

      if (response.success === true) {
        setmodalTitle("");
        setSelectedCases([]);

        await _getData();

        setAlerts({
          ...alerts,
          type: "success",
          msg: response.message,
          open: true,
        });

        return true;
      }

      setAlerts({
        ...alerts,
        type: "error",
        msg: response.message || "Reassigning collection cases failed.",
        open: true,
      });

      return false;
    } finally {
      setActionLoading(actionKey, false);
    }
  };

  const _handleFindAssCollLoan = async () => {
    if (
      inputs.userId === "" &&
      inputs.loanId === "" &&
      dateRange === null &&
      select.loanType === "" &&
      select.caseStatus === "" &&
      select.collectionStaff === "" &&
      inputs.daysToFrom === "" &&
      inputs.phone === ""
    )
      return setAlerts({
        ...alerts,
        type: "info",
        msg: "please provide a search parameter",
        open: true,
      });

    let filterData = {
      type: filterType,
      filterArray: [
        inputs.userId,
        inputs.loanId,
        dateRange,
        select.loanType,
        select.caseStatus,
        select.collectionStaff,
        inputs.phone,
        inputs.daysToFrom,
      ],
    };

    let dataToFilter = assignedColCases;

    setGlobalLoader(true);

    let response = await _filterAssColCases({
      filterData,
      dataToFilter,
      customers,
    });

    if (response === null || response === undefined) {
      setAlerts({
        ...alerts,
        type: "warning",
        msg: "No record found",
        open: true,
      });

      setGlobalLoader(false);
      return;
    }

    if (originalData.length === 0) {
      setOriginalData(assignedColCases);
    }

    if (originalData.length !== 0) {
      setOriginalData2(assignedColCases);
    }

    let sorted = await _sortLoans(response);

    setAssColCases(sorted);

    setGlobalLoader(false);
  };

  const _clearAssColCases = () => {
    if (originalData.length === 0) return null;

    setInput({
      ...inputs,
      userId: "",
      loanId: "",
      phone: "",
      daysToFrom: "",
    });

    setRange(null);

    setSelect({
      ...select,
      loanType: "",
      caseStatus: "",
      collectionStaff: "",
    });

    setAssColCases(originalData);

    setOriginalData2([]);

    setOriginalData([]);
  };

  const _handleCompCollLoan = async () => {
    if (
      inputs.userId === "" &&
      inputs.loanId === "" &&
      dateRange === null &&
      select.loanType === "" &&
      select.collectionStaff === "" &&
      inputs.daysToFrom === "" &&
      inputs.phone === ""
    )
      return setAlerts({
        ...alerts,
        type: "info",
        msg: "please provide a search parameter",
        open: true,
      });

    let filterData = {
      type: filterType,
      filterArray: [
        inputs.userId,
        inputs.loanId,
        dateRange,
        select.loanType,
        select.collectionStaff,
        inputs.phone,
        inputs.daysToFrom,
      ],
    };

    let dataToFilter = completedColCases;

    setGlobalLoader(true);

    let response = await _filterCompColCases({
      filterData,
      dataToFilter,
      customers,
    });

    if (response === null || response === undefined) {
      setAlerts({
        ...alerts,
        type: "warning",
        msg: "No record found",
        open: true,
      });

      setGlobalLoader(false);
      return;
    }

    if (originalData.length === 0) {
      setOriginalData(completedColCases);
    }

    if (originalData.length !== 0) {
      setOriginalData2(completedColCases);
    }

    let sorted = await _sortLoans(response);

    setCompColCases(sorted);

    setGlobalLoader(false);
  };

  const _clearCompColCases = () => {
    if (originalData.length === 0) return null;

    setInput({
      ...inputs,
      userId: "",
      loanId: "",
      phone: "",
      daysToFrom: "",
    });

    setRange(null);

    setSelect({
      ...select,
      loanType: "",
      collectionStaff: "",
    });

    setCompColCases(originalData);

    setOriginalData2([]);

    setOriginalData([]);
  };

  const _handleFindColPayRec = async () => {
    if (
      inputs.userId === "" &&
      inputs.loanId === "" &&
      dateRange === null &&
      select.collectionStaff === "" &&
      inputs.phone === ""
    )
      return setAlerts({
        ...alerts,
        type: "info",
        msg: "please provide a search parameter",
        open: true,
      });

    let filterData = {
      type: filterType,
      filterArray: [
        inputs.userId,
        inputs.loanId,
        dateRange,
        select.collectionStaff,
        inputs.phone,
      ],
    };

    let dataToFilter = colPayRecs;

    setGlobalLoader(true);

    let response = await _filterColPayRec({
      filterData,
      dataToFilter,
      customers,
    });

    if (response === null || response === undefined) {
      setAlerts({
        ...alerts,
        type: "warning",
        msg: "No record found",
        open: true,
      });

      setGlobalLoader(false);
      return;
    }

    setOriginalData(colPayRecs);

    let sorted = await _sortLoans(response);

    setColPayCases(sorted);

    setGlobalLoader(false);
  };

  const _clearColPayRec = () => {
    if (originalData.length === 0) return null;

    setInput({
      ...inputs,
      userId: "",
      loanId: "",
      phone: "",
    });

    setRange(null);

    setSelect({
      ...select,
      collectionStaff: "",
    });

    setColPayCases(originalData);

    setOriginalData([]);
  };

  const _handleFindOrderLoan = async () => {
    if (
      inputs.userId === "" &&
      inputs.loanId === "" &&
      dateRange === null &&
      inputs.phone === ""
    )
      return setAlerts({
        ...alerts,
        type: "info",
        msg: "please provide a search parameter",
        open: true,
      });

    let filterData = {
      type: filterType,
      filterArray: [inputs.userId, inputs.loanId, dateRange, inputs.phone],
    };

    let dataToFilter = loans;

    setGlobalLoader(true);

    let response = await _filterLoan({
      filterData,
      dataToFilter,
      customers,
    });

    if (response === null || response === undefined) {
      setAlerts({
        ...alerts,
        type: "warning",
        msg: "No record found",
        open: true,
      });

      setGlobalLoader(false);
      return;
    }

    setOriginalData(loans);

    let sorted = await _sortLoans(response);

    setLoans(sorted);

    setGlobalLoader(false);
  };

  const _clearLoan = () => {
    if (originalData.length === 0) return null;

    setInput({
      ...inputs,
      userId: "",
      loanId: "",
      phone: "",
    });

    setRange(null);

    setLoans(originalData);

    setOriginalData([]);
  };

  const handleNext = () => {
    if (
      inputs.loanId === "" ||
      inputs.userId === "" ||
      inputs.date === "" ||
      selectedRadio === ""
    )
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "all fields are required",
        open: true,
      });

    let currCase = loans.find(
      (loan) => loan.ID.trim() === inputs.loanId.trim()
    );

    let customer = customers.find(
      (person) => person.userId.trim() === inputs.userId.trim()
    );

    if (!customer)
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "user id is wrong",
        open: true,
      });

    if (!currCase)
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "loan id is wrong",
        open: true,
      });

    if (currCase.userId !== customer.userId)
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "loan id does not match with user id",
        open: true,
      });

    setLoan(currCase);

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const _handleSubmitRecord = async () => {
    setGlobalLoader(true);

    if (selectedRadio === "balance") {
      const data = {
        recordType: "balance",
        userId: loan.userId,
        clearanceDate: new Date(inputs.date),
        remainingAmount:
          loan.amountPaid === undefined
            ? parseFloat(loan.repaymentAmount) - parseFloat(inputs.amount)
            : (
                parseFloat(loan.repaymentAmount) -
                (parseFloat(loan.amountPaid) + parseFloat(inputs.amount))
              ).toFixed(2),
        amountPaid:
          loan.amountPaid === undefined
            ? parseFloat(loan.repaymentAmount)
            : (
                parseFloat(loan.repaymentAmount) - parseFloat(loan.amountPaid)
              ).toFixed(2),
        actualAmount: loan.repaymentAmount,
        clearRemainingAmount: true,
        reviewedBy: user.userName,
        ID: loan.ID,
      };

      const response = await _createClearRecBalance(data);

      if (response.success === 0) {
        setAlerts({
          ...alerts,
          type: "error",
          msg: response.message,
          open: true,
        });

        setGlobalLoader(false);
        return;
      }

      await _getData();

      setInput({
        ...inputs,
        loanId: "",
        userId: "",
        date: "",
      });

      setSelectedRadio("");

      setActiveStep(0);

      setGlobalLoader(false);

      return;
    }

    if (inputs.amount === "" || inputs.remarks === "" || inputs.image === null)
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "provide all fields",
        open: true,
      });

    let selfieData = inputs.image;

    let data = {
      recordType: selectedRadio,
      userId: loan.userId,
      clearanceDate: new Date(inputs.date),
      remainingAmount:
        loan.amountPaid === undefined
          ? parseFloat(loan.repaymentAmount) - parseFloat(inputs.amount)
          : (
              parseFloat(loan.repaymentAmount) -
              (parseFloat(loan.amountPaid) + parseFloat(inputs.amount))
            ).toFixed(2),
      amountPaid: inputs.amount,
      actualAmount: loan.repaymentAmount,
      clearRemainingAmount: inputs.check,
      remarks: inputs.remarks,
      reviewedBy: user.userName,
    };

    const response = await _createClearPublic({
      selfieData,
      data,
      ID: loan.ID,
    });

    if (response.success === 0) {
      setAlerts({
        ...alerts,
        type: "error",
        msg: response.message,
        open: true,
      });

      setGlobalLoader(false);
      return;
    }

    await _getData();

    setInput({
      ...inputs,
      loanId: "",
      userId: "",
      date: "",
      amount: "",
      check: false,
      remarks: "",
    });

    setAlerts({
      ...alerts,
      type: "success",
      msg: response.message,
      open: true,
    });

    setSelectedRadio("");

    setActiveStep(0);

    setGlobalLoader(false);
  };

  const _handleConfirmClearPublic = async (area) => {
    if (!_hasAccess("action:payment:review"))
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "You do not have permission to review payment records",
        open: true,
      });

    if (inputs.image === null)
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "provide a confirmation proof image",
        open: true,
      });

    setBigLoader(true);

    let selfieData = inputs.image;

    let data = {
      rejectRemarks: area,
      auditResults: radio,
      confirmedBy: user.userName,
    };

    const response = await _confirmClearPublic({
      selfieData,
      data,
      ID: loan.ID,
    });

    if (response.success === 0) {
      setAlerts({
        ...alerts,
        type: "error",
        msg: response.message,
        open: true,
      });

      setBigLoader(false);
      return;
    }

    await _getData();

    setInput({
      ...inputs,
      image: null,
    });

    setRadio("");

    setAlerts({
      ...alerts,
      type: "success",
      msg: response.message,
      open: true,
    });

    setmodalTitle("");

    setBigLoader(false);
  };

  const _handleConfirmClear = async (area) => {
    if (!_hasAccess("action:payment:review"))
      return setAlerts({
        ...alerts,
        type: "warning",
        msg: "You do not have permission to review payment records",
        open: true,
      });

    setBigLoader(true);

    let data = {
      rejectRemarks: area,
      auditResults: radio,
      confirmedBy: user.userName,
    };

    const response = await _confirmClearBalance({
      data,
      ID: loan.ID,
    });

    if (response.success === 0) {
      setAlerts({
        ...alerts,
        type: "error",
        msg: response.message,
        open: true,
      });

      setBigLoader(false);
      return;
    }

    await _getData();

    setRadio("");

    setAlerts({
      ...alerts,
      type: "success",
      msg: response.message,
      open: true,
    });

    setmodalTitle("");

    setBigLoader(false);
  };

  const _handleFindManualPayment = async () => {
    if (
      inputs.userId === "" &&
      inputs.loanId === "" &&
      dateRange === null &&
      inputs.phone === ""
    )
      return setAlerts({
        ...alerts,
        type: "info",
        msg: "please provide a search parameter",
        open: true,
      });

    let filterData = {
      type: filterType,
      filterArray: [inputs.userId, inputs.loanId, dateRange, inputs.phone],
    };

    let dataToFilter = clearedCases;

    setGlobalLoader(true);

    let response = await _filterManualPayment({
      filterData,
      dataToFilter,
      customers,
    });

    if (response === null || response === undefined) {
      setAlerts({
        ...alerts,
        type: "warning",
        msg: "No record found",
        open: true,
      });

      setGlobalLoader(false);
      return;
    }

    setOriginalData(clearedCases);

    let sorted = await _sortLoans(response);

    setClearedCases(sorted);

    setGlobalLoader(false);
  };

  const _clearManualPayment = () => {
    if (originalData.length === 0) return null;

    setInput({
      ...inputs,
      userId: "",
      loanId: "",
      phone: "",
    });

    setRange(null);

    setClearedCases(originalData);

    setOriginalData([]);
  };

  const _handleUploadImage = async () => {
    setGlobalLoader(true);
    const formData = new FormData();

    formData.append("idImage", inputs.image);

    const response = await _updateIDCard({ formData, userId: loan.userId });

    if (response.success === 0) {
      setAlerts({
        ...alerts,
        type: "error",
        msg: response.message,
        open: true,
      });

      setGlobalLoader(false);
      return;
    }

    await _getData();

    setInput({
      ...inputs,
      image: null,
    });

    setAlerts({
      ...alerts,
      type: "success",
      msg: response.message,
      open: true,
    });

    setGlobalLoader(false);
  };

  const _routeToPage = (data) => {
    history.push(data);
  };

  return (
    <GlobalContext.Provider
      value={{
        aside,
        _handleSideTab,
        _routeToPage,
        openModal,
        setModal,
        select,
        setSelect,
        _handleSelect,
        radio,
        setRadio,
        alerts,
        setAlerts,
        customers,
        loans,
        admins,
        staffGroups,
        globalLoader,
        bootstrapLoading,
        personnelLoading,
        isActionLoading,
        bigLoader,
        setBigLoader,
        user,
        addUserModal,
        setaddUserModal,
        modalTitle,
        setmodalTitle,
        roles,
        departments,
        genders,
        _handleCreateAdmin,
        _handleOnChange,
        inputs,
        _handleChangeActiveStatus,
        isEdit,
        setIsEdit,
        _handleEditUser,
        userDetails,
        setUserDetails,
        _handleDelete,
        _handleCreateStaffGroup,
        _handleUpdateStaffGroup,
        _handleDeleteStaffGroup,
        _handleAssignUsersToGroup,
        _getGroupMembers,
        _logout,
        _handleSearchUsers,
        _resetSearchParams,
        originalData,
        _clearLoanSearch,
        _handleCustomerActiveStatus,
        _handleSearchCustomers,
        customer,
        setCustomer,
        customerProfileLoading,
        _loadCustomerDetails,
        _handleFindCustomer,
        _clearCustomerSearch,
        _handleEditCustomer,
        loanTypes,
        inComingLoans,
        dateRange,
        setRange,
        _handleFindLoan,
        assignModal,
        setAssignModal,
        loan,
        setLoan,
        loanDetailsModals,
        setLoanDetailsModal,
        setInput,
        setAdmins,
        selectedCases,
        setSelectedCases,
        _handleAssignCase,
        assignedCases,
        setAssignedCases,
        _handleFindAssignedLoan,
        _clearAssignedLoanSearch,
        _handleReAssignCase,
        _handleLoanStatus,
        completedCases,
        _handleFindCompletedLoan,
        _clearCompletedLoanSearch,
        callRecords,
        setCallRecordsModal,
        callResult,
        relationship,
        _handleAddCallRecord,
        handleClearDisbursed,
        handleMarkManualDisbursed,
        _retryFailedDisbursement,
        _handleSeachDis,
        disbursed,
        _handleClearSearch,
        preCollectionCases,
        assignedPreColCases,
        collectionCases,
        _handleOrderlistDetails,
        _handleDateSearch,
        _clearDateSearch,
        _handlePreAssignCase,
        _handleReAssignPreCase,
        preColDays,
        _handleFindPreLoan,
        _clearPreLoanSearch,
        preCaseStatus,
        _handleFindAssPreLoan,
        _clearAssPreLoanSearch,
        preCompCases,
        _handleFindCompPreLoan,
        _clearPreCompLoanSearch,
        prePayment,
        _handleFindPrePayRec,
        _clearPrePayRec,
        _clearColCases,
        _handleFindCompLoan,
        assignedColCases,
        _handleColAssignCase,
        _handleReAssignColCase,
        _handleFindAssCollLoan,
        _clearAssColCases,
        completedColCases,
        _handleCompCollLoan,
        _clearCompColCases,
        colPayRecs,
        _handleFindColPayRec,
        _clearColPayRec,
        _handleFindOrderLoan,
        _clearLoan,
        activeStep,
        setActiveStep,
        selectedRadio,
        setSelectedRadio,
        handleNext,
        _handleSubmitRecord,
        imageToView,
        setImageToView,
        clearanceRecords,
        setClearanceRecords,
        setOriginalData,
        originalData2,
        setOriginalData2,
        balClearanceRecords,
        setBalClearanceRecords,
        _handleConfirmClearPublic,
        _handleConfirmClear,
        clearedCases,
        _handleFindManualPayment,
        _clearManualPayment,
        _handleUploadImage,
        preRank,
        preRankCase,
        colRank,
        colRankCase,
        _refreshAllData: _getData,
        _hasAccess,
      }}
    >
      {props.children}
    </GlobalContext.Provider>
  );
}
