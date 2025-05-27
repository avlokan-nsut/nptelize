interface Props {
    isClosed: boolean,
    onClick: () => void,
    onStateChange: (isClosed: boolean) => void;
    SubjectName : string | null;
    Disabled : boolean | false;
}

const AlertDialog = ({ isClosed, onClick, onStateChange ,SubjectName, Disabled }: Props) => {
  return (
    <>
      {!isClosed && (
        <div role="alert" className="alert alert-vertical sm:alert-horizontal fixed bottom-4 right-4 z-50 shadow-lg 
             opacity-0 translate-y-1 transition-all duration-10 ease-out animate-fade-in">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-info h-6 w-6 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>{`Coordinator will be able to see 'no certificate' status for the subject ${SubjectName} . You can upload certificate later at any time`}.</span>
          <div className="flex flex-row space-x-2">
            <button className="btn btn-sm" onClick={() => onStateChange(true)} disabled={Disabled}>Close</button>
            <button className="btn btn-sm btn-primary" onClick={onClick} disabled={Disabled}>Mark as no certificate</button>
          </div>
        </div>
      )}
    </>
  );
};

export default AlertDialog;