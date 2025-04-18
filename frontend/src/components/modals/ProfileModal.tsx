import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getActorProfile } from "../../api/actor";
import { Dialog, DialogContent } from "../ui/dialog";
import { useTranslation } from "react-i18next";

function ProfileModal({ visible, profileId, onClose }) {
  const [profile, setProfile] = useState({});
  const { t, i18n } = useTranslation();

  const fetchActorProfile = async () => {
    const { error, actor } = await getActorProfile(profileId);
    if (error) return toast.error(t(error));

    setProfile(actor);
  };

  const getName = (profile) => {
    const nm = `actors.${profile.id}.name`;
    if (i18n.exists(nm)) {
      return t(nm);
    }
    return profile.name;
  };

  useEffect(() => {
    if (profileId) fetchActorProfile();
  }, [profileId]);

  const { avatar, name, about, gender } = profile;

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent className="flex gap-2 [&>button]:hidden max-w-[600px]">
        <div className="w-36 h-36 aspect-square flex items-center justify-center ">
          <img className="" src={avatar} alt="" />
        </div>
        <div className="overflow-auto">
          <div className="mb-1">
            <p className="capitalize ">{getName(profile)}</p>
            <p className="capitalize text-muted-foreground  text-xs">
              {t(gender)}
            </p>
          </div>
          <p className="text-xs">{about}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ProfileModal;
