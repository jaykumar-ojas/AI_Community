import { useState } from "react"
import { ShareIcon } from "../../asset/icons";
import ShareButtons from "./Share";


const ShareFile = ({h,w,pos="bottom-8 right-2",id, text,type}) =>{
    const [showShare,setShowShare] = useState(false);
    return (
        <div className="relative inline-block">
            <button
                onClick={() => setShowShare(!showShare)}
                className="text-blue-600 dark:text-blue-400 cursor-pointer animate-pop transform hover:scale-125 transition-transform duration-200"
            >
            <ShareIcon h={h} w={w}/>
            </button>

            {/* Share buttons menu */}
            {showShare && (
            <div className={`absolute ${pos}  z-50  flex flex-row gap-3 items-center bg-white dark:bg-[#EDEDED] px-6 py-2 rounded-3xl shadow-xl`}>
                <ShareButtons id={id} text={text} type={type} />
            </div>
            )}
        </div>
    )
}

export default ShareFile;