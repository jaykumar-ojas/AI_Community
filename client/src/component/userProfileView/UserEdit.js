import bg from "../../asset/backGroundImage.png";
import UserHeaderEdit from "./Component/UserHeaderEdit";
import UserHeader from "./Component/UserHedaer";

const UserEditProfile = () => {

  return (
    <div className="min-h-screen bg-gray-50 p-0 sm:p-6"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="max-w-7xl mx-auto bg-white sm:rounded-xl shadow-lg overflow-hidden">
        <UserHeaderEdit/>
      </div>
    </div>
  );
};

export default UserEditProfile;