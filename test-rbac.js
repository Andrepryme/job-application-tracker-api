const { userHasPermission } = require("./db/rbac");

(async () => {
    const allowed = await userHasPermission(7, "create_application");
    console.log("Permission:", allowed);
    process.exit();
})();